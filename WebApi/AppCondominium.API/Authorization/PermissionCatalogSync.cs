using System.Text.Json;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.API.Authorization;

/// <summary>
/// Sobe o catálogo docs/rbac para PermissionKey e semeia a matriz quando a linha ainda não existe.
/// </summary>
public class PermissionCatalogSync : IHostedService
{
    private readonly IServiceProvider _services;
    private readonly IHostEnvironment _env;
    private readonly ILogger<PermissionCatalogSync> _logger;

    public PermissionCatalogSync(IServiceProvider services, IHostEnvironment env, ILogger<PermissionCatalogSync> logger)
    {
        _services = services;
        _env = env;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var dir = FindDocs(_env.ContentRootPath);
        if (dir == null)
        {
            _logger.LogWarning("Catálogo RBAC não encontrado a partir de {Root}.", _env.ContentRootPath);
            return;
        }

        try
        {
            using var scope = _services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await SyncAsync(db, dir, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Sync do catálogo RBAC não aplicado. A API segue no ar.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    internal static async Task SyncAsync(AppDbContext db, string dir, CancellationToken ct)
    {
        var catalog = await ReadAsync<CatalogFile>(Path.Combine(dir, "funcionalidades-catalogo.json"), ct);
        var grants = await ReadAsync<GrantsFile>(Path.Combine(dir, "concessoes-perfil.json"), ct);

        foreach (var nome in grants.Profiles ?? [])
        {
            var exists = await db.PerfilAcesso.AnyAsync(p => p.Descricao == nome, ct);
            if (!exists)
                db.PerfilAcesso.Add(new PerfilAcesso { Descricao = nome });
        }
        await db.SaveChangesAsync(ct);

        var keys = await db.PermissionKey.ToListAsync(ct);
        foreach (var item in catalog.Functionalities ?? [])
        {
            if (string.IsNullOrWhiteSpace(item.PermissionKey))
                continue;
            var row = keys.FirstOrDefault(k => k.Chave == item.PermissionKey);
            if (row == null)
            {
                row = new PermissionKey { Chave = item.PermissionKey };
                db.PermissionKey.Add(row);
                keys.Add(row);
            }
            row.Nome = item.DisplayName ?? item.PermissionKey;
            row.Modulo = item.Module ?? "Geral";
        }
        await db.SaveChangesAsync(ct);

        var perfis = await db.PerfilAcesso.AsNoTracking().ToListAsync(ct);
        var keyByChave = keys.ToDictionary(k => k.Chave, k => k.IdPermissionKey, StringComparer.OrdinalIgnoreCase);
        foreach (var grant in grants.Grants ?? [])
        {
            if (string.IsNullOrWhiteSpace(grant.Perfil) || string.IsNullOrWhiteSpace(grant.PermissionKey))
                continue;
            if (!keyByChave.TryGetValue(grant.PermissionKey, out var idKey))
                continue;
            var perfil = perfis.FirstOrDefault(p => string.Equals(p.Descricao, grant.Perfil, StringComparison.OrdinalIgnoreCase));
            if (perfil == null)
                continue;
            var exists = await db.PerfilPermissao.AnyAsync(p => p.IdPerfil == perfil.IdPerfil && p.IdPermissionKey == idKey, ct);
            if (exists)
                continue;
            db.PerfilPermissao.Add(new PerfilPermissao
            {
                IdPerfil = perfil.IdPerfil,
                IdPermissionKey = idKey,
                Visualizar = grant.Visualizar,
                Incluir = grant.Incluir,
                Alterar = grant.Alterar,
                Excluir = grant.Excluir
            });
        }
        await db.SaveChangesAsync(ct);
    }

    private static async Task<T> ReadAsync<T>(string path, CancellationToken ct) where T : new()
    {
        if (!File.Exists(path))
            return new T();
        await using var stream = File.OpenRead(path);
        return await JsonSerializer.DeserializeAsync<T>(stream, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }, ct) ?? new T();
    }

    internal static string? FindDocs(string contentRoot)
    {
        var dir = new DirectoryInfo(contentRoot);
        while (dir != null)
        {
            var candidate = Path.Combine(dir.FullName, "docs", "rbac", "funcionalidades-catalogo.json");
            if (File.Exists(candidate))
                return Path.Combine(dir.FullName, "docs", "rbac");
            dir = dir.Parent;
        }
        return null;
    }

    private sealed class CatalogFile
    {
        public List<CatalogItem>? Functionalities { get; set; }
    }

    private sealed class CatalogItem
    {
        public string? PermissionKey { get; set; }
        public string? DisplayName { get; set; }
        public string? Module { get; set; }
    }

    private sealed class GrantsFile
    {
        public List<string>? Profiles { get; set; }
        public List<GrantItem>? Grants { get; set; }
    }

    private sealed class GrantItem
    {
        public string? Perfil { get; set; }
        public string? PermissionKey { get; set; }
        public bool Visualizar { get; set; }
        public bool Incluir { get; set; }
        public bool Alterar { get; set; }
        public bool Excluir { get; set; }
    }
}
