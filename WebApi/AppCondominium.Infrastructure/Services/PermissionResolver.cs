using System.Collections.Concurrent;
using AppCondominium.Application.Authorization;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.Infrastructure.Services;

public class PermissionResolver : IPermissionResolver
{
    private static readonly string[] Acoes = ["Visualizar", "Incluir", "Alterar", "Excluir"];
    private static readonly ConcurrentDictionary<string, uint> PermissionKeyIds = new(StringComparer.OrdinalIgnoreCase);

    private readonly AppDbContext _db;

    public PermissionResolver(AppDbContext db) => _db = db;

    public async Task<bool> HasAsync(uint idPessoa, uint idCondominio, string permissionKey, string acao, CancellationToken ct = default)
    {
        var perfil = await CarregarPerfilAsync(idPessoa, idCondominio, ct);
        if (perfil.AcessoTotal)
            return true;

        var idPermissionKey = await ResolvePermissionKeyIdAsync(permissionKey, ct);
        if (idPermissionKey == null || perfil.IdPerfil == null)
            return false;

        var matriz = await _db.PerfilPermissao.AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdPerfil == perfil.IdPerfil && p.IdPermissionKey == idPermissionKey, ct);
        var excecao = await _db.PessoaPermissaoExcecao.IgnoreQueryFilters().AsNoTracking()
            .FirstOrDefaultAsync(e =>
                e.IdPessoa == idPessoa && e.IdCondominio == idCondominio && e.IdPermissionKey == idPermissionKey, ct);

        return Flag(excecao, matriz, acao);
    }

    public async Task<PermissionSnapshot> SnapshotAsync(uint idPessoa, uint idCondominio, CancellationToken ct = default)
    {
        var perfil = await CarregarPerfilAsync(idPessoa, idCondominio, ct);
        return await MontarSnapshotAsync(
            idPessoa, idCondominio, perfil.IdPerfil, perfil.Nome, perfil.AcessoTotal, aplicarExcecoes: true, ct);
    }

    public async Task<PermissionSnapshot> SnapshotPorPerfilAsync(
        uint idPessoa, uint idCondominio, uint idPerfil, CancellationToken ct = default)
    {
        var cadastro = await _db.PerfilAcesso.AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdPerfil == idPerfil, ct);
        var nome = string.IsNullOrWhiteSpace(cadastro?.Descricao) ? "Morador" : cadastro!.Descricao!.Trim();
        var acessoTotal = nome.Equals("Administrador", StringComparison.OrdinalIgnoreCase);
        var primario = await CarregarPerfilAsync(idPessoa, idCondominio, ct);
        return await MontarSnapshotAsync(
            idPessoa, idCondominio, idPerfil, nome, acessoTotal, aplicarExcecoes: primario.IdPerfil == idPerfil, ct);
    }

    private async Task<PermissionSnapshot> MontarSnapshotAsync(
        uint idPessoa,
        uint idCondominio,
        uint? idPerfil,
        string nome,
        bool acessoTotal,
        bool aplicarExcecoes,
        CancellationToken ct)
    {
        if (acessoTotal)
            return new PermissionSnapshot(true, nome, Array.Empty<string>());

        if (idPerfil == null)
            return new PermissionSnapshot(false, nome, Array.Empty<string>());

        var keys = await _db.PermissionKey.AsNoTracking().ToListAsync(ct);
        var matriz = await _db.PerfilPermissao.AsNoTracking()
            .Where(p => p.IdPerfil == idPerfil)
            .ToListAsync(ct);
        var excecoes = aplicarExcecoes
            ? await _db.PessoaPermissaoExcecao.IgnoreQueryFilters().AsNoTracking()
                .Where(e => e.IdPessoa == idPessoa && e.IdCondominio == idCondominio)
                .ToListAsync(ct)
            : new List<PessoaPermissaoExcecao>();

        var claims = new List<string>();
        foreach (var key in keys)
        {
            var row = matriz.FirstOrDefault(m => m.IdPermissionKey == key.IdPermissionKey);
            var ex = excecoes.FirstOrDefault(e => e.IdPermissionKey == key.IdPermissionKey);
            foreach (var acao in Acoes)
            {
                if (Flag(ex, row, acao))
                    claims.Add($"{key.Chave}:{acao}");
            }
        }
        return new PermissionSnapshot(false, nome, claims);
    }

    public async Task<IReadOnlyList<PermissaoLinha>> MatrizPerfilAsync(uint idPerfil, CancellationToken ct = default)
    {
        var keys = await _db.PermissionKey.AsNoTracking().OrderBy(k => k.Modulo).ThenBy(k => k.Nome).ToListAsync(ct);
        var rows = await _db.PerfilPermissao.AsNoTracking().Where(p => p.IdPerfil == idPerfil).ToListAsync(ct);
        return keys.Select(k =>
        {
            var row = rows.FirstOrDefault(r => r.IdPermissionKey == k.IdPermissionKey);
            return new PermissaoLinha(k.Chave, k.Nome, k.Modulo,
                row?.Visualizar == true, row?.Incluir == true, row?.Alterar == true, row?.Excluir == true);
        }).ToList();
    }

    public async Task SaveMatrizPerfilAsync(uint idPerfil, IReadOnlyList<PermissaoLinha> linhas, CancellationToken ct = default)
    {
        var keys = await _db.PermissionKey.ToListAsync(ct);
        var byChave = keys.ToDictionary(k => k.Chave, k => k.IdPermissionKey, StringComparer.OrdinalIgnoreCase);
        var atuais = await _db.PerfilPermissao.Where(p => p.IdPerfil == idPerfil).ToListAsync(ct);
        _db.PerfilPermissao.RemoveRange(atuais);
        foreach (var linha in linhas)
        {
            if (!byChave.TryGetValue(linha.PermissionKey, out var idKey))
                continue;
            if (!linha.Visualizar && !linha.Incluir && !linha.Alterar && !linha.Excluir)
                continue;
            _db.PerfilPermissao.Add(new PerfilPermissao
            {
                IdPerfil = idPerfil,
                IdPermissionKey = idKey,
                Visualizar = linha.Visualizar,
                Incluir = linha.Incluir,
                Alterar = linha.Alterar,
                Excluir = linha.Excluir
            });
        }
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<PermissaoLinha>> ExcecoesAsync(uint idPessoa, uint idCondominio, CancellationToken ct = default)
    {
        var perfil = await CarregarPerfilAsync(idPessoa, idCondominio, ct);
        var keys = await _db.PermissionKey.AsNoTracking().OrderBy(k => k.Modulo).ThenBy(k => k.Nome).ToListAsync(ct);
        var matriz = perfil.IdPerfil == null
            ? new List<PerfilPermissao>()
            : await _db.PerfilPermissao.AsNoTracking().Where(p => p.IdPerfil == perfil.IdPerfil).ToListAsync(ct);
        var excecoes = await _db.PessoaPermissaoExcecao.IgnoreQueryFilters().AsNoTracking()
            .Where(e => e.IdPessoa == idPessoa && e.IdCondominio == idCondominio)
            .ToListAsync(ct);

        return keys.Select(k =>
        {
            var ex = excecoes.FirstOrDefault(e => e.IdPermissionKey == k.IdPermissionKey);
            var row = matriz.FirstOrDefault(r => r.IdPermissionKey == k.IdPermissionKey);
            var fonte = ex ?? (row == null ? null : new PessoaPermissaoExcecao
            {
                Visualizar = row.Visualizar,
                Incluir = row.Incluir,
                Alterar = row.Alterar,
                Excluir = row.Excluir
            });
            return new PermissaoLinha(k.Chave, k.Nome, k.Modulo,
                fonte?.Visualizar == true, fonte?.Incluir == true, fonte?.Alterar == true, fonte?.Excluir == true);
        }).ToList();
    }

    public async Task SaveExcecoesAsync(uint idPessoa, uint idCondominio, IReadOnlyList<PermissaoLinha> linhas, CancellationToken ct = default)
    {
        var perfil = await CarregarPerfilAsync(idPessoa, idCondominio, ct);
        var keys = await _db.PermissionKey.ToListAsync(ct);
        var byChave = keys.ToDictionary(k => k.Chave, k => k.IdPermissionKey, StringComparer.OrdinalIgnoreCase);
        var matriz = perfil.IdPerfil == null
            ? new List<PerfilPermissao>()
            : await _db.PerfilPermissao.AsNoTracking().Where(p => p.IdPerfil == perfil.IdPerfil).ToListAsync(ct);
        var atuais = await _db.PessoaPermissaoExcecao.IgnoreQueryFilters()
            .Where(e => e.IdPessoa == idPessoa && e.IdCondominio == idCondominio)
            .ToListAsync(ct);
        _db.PessoaPermissaoExcecao.RemoveRange(atuais);
        foreach (var linha in linhas)
        {
            if (!byChave.TryGetValue(linha.PermissionKey, out var idKey))
                continue;
            var row = matriz.FirstOrDefault(m => m.IdPermissionKey == idKey);
            var igualAoPerfil = row == null
                ? !linha.Visualizar && !linha.Incluir && !linha.Alterar && !linha.Excluir
                : row.Visualizar == linha.Visualizar && row.Incluir == linha.Incluir
                    && row.Alterar == linha.Alterar && row.Excluir == linha.Excluir;
            if (igualAoPerfil)
                continue;
            _db.PessoaPermissaoExcecao.Add(new PessoaPermissaoExcecao
            {
                IdPessoa = idPessoa,
                IdCondominio = idCondominio,
                IdPermissionKey = idKey,
                Visualizar = linha.Visualizar,
                Incluir = linha.Incluir,
                Alterar = linha.Alterar,
                Excluir = linha.Excluir
            });
        }
        await _db.SaveChangesAsync(ct);
    }

    private async Task<uint?> ResolvePermissionKeyIdAsync(string permissionKey, CancellationToken ct)
    {
        if (PermissionKeyIds.TryGetValue(permissionKey, out var cached))
            return cached;

        var key = await _db.PermissionKey.AsNoTracking()
            .FirstOrDefaultAsync(k => k.Chave == permissionKey, ct);
        if (key == null)
            return null;

        PermissionKeyIds.TryAdd(permissionKey, key.IdPermissionKey);
        return key.IdPermissionKey;
    }

    private async Task<(uint? IdPerfil, string Nome, bool AcessoTotal)> CarregarPerfilAsync(uint idPessoa, uint idCondominio, CancellationToken ct)
    {
        var vinculo = await _db.PessoaCondominio.IgnoreQueryFilters().AsNoTracking()
            .FirstOrDefaultAsync(v => v.IdPessoa == idPessoa && v.IdCondominio == idCondominio, ct);

        uint? idPerfil = vinculo?.IdPerfil;
        string nome = "Morador";
        if (idPerfil == null)
        {
            var morador = await _db.PerfilAcesso.AsNoTracking()
                .FirstOrDefaultAsync(p => p.Descricao != null && p.Descricao.ToLower() == "morador", ct);
            idPerfil = morador?.IdPerfil;
            if (morador?.Descricao != null)
                nome = morador.Descricao;
        }
        else
        {
            var perfil = await _db.PerfilAcesso.AsNoTracking()
                .FirstOrDefaultAsync(p => p.IdPerfil == idPerfil, ct);
            if (!string.IsNullOrWhiteSpace(perfil?.Descricao))
                nome = perfil!.Descricao!.Trim();
        }

        var acessoTotal = nome.Equals("Administrador", StringComparison.OrdinalIgnoreCase);
        return (idPerfil, nome, acessoTotal);
    }

    private static bool Flag(PessoaPermissaoExcecao? excecao, PerfilPermissao? matriz, string acao)
    {
        if (excecao != null)
            return Acao(excecao.Visualizar, excecao.Incluir, excecao.Alterar, excecao.Excluir, acao);
        if (matriz == null)
            return false;
        return Acao(matriz.Visualizar, matriz.Incluir, matriz.Alterar, matriz.Excluir, acao);
    }

    private static bool Acao(bool visualizar, bool incluir, bool alterar, bool excluir, string acao) => acao switch
    {
        "Visualizar" => visualizar,
        "Incluir" => incluir,
        "Alterar" => alterar,
        "Excluir" => excluir,
        _ => false
    };
}
