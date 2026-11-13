using AppCondominium.Application.Storage;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace AppCondominium.Infrastructure.Storage;

/// <summary>Remove o objeto no S3 quando o registro que o referencia é excluído.</summary>
public sealed class ArquivoCleanupInterceptor : SaveChangesInterceptor
{
    private readonly IArquivoStorage _arquivos;
    private readonly StorageObjectKeyBuilder _chaves;
    private readonly IServiceScopeFactory _scopes;
    private readonly ILogger<ArquivoCleanupInterceptor> _logger;
    private readonly List<Func<CancellationToken, Task>> _depois = [];

    public ArquivoCleanupInterceptor(
        IArquivoStorage arquivos,
        StorageObjectKeyBuilder chaves,
        IServiceScopeFactory scopes,
        ILogger<ArquivoCleanupInterceptor> logger)
    {
        _arquivos = arquivos;
        _chaves = chaves;
        _scopes = scopes;
        _logger = logger;
    }

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        Capturar(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        Capturar(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    public override int SavedChanges(SaveChangesCompletedEventData eventData, int result)
    {
        var saved = base.SavedChanges(eventData, result);
        FlushAsync(CancellationToken.None).GetAwaiter().GetResult();
        return saved;
    }

    public override async ValueTask<int> SavedChangesAsync(
        SaveChangesCompletedEventData eventData,
        int result,
        CancellationToken cancellationToken = default)
    {
        var saved = await base.SavedChangesAsync(eventData, result, cancellationToken);
        await FlushAsync(cancellationToken);
        return saved;
    }

    private void Capturar(DbContext? context)
    {
        _depois.Clear();
        if (context == null)
            return;

        foreach (var entry in context.ChangeTracker.Entries<Pessoafisica>())
        {
            if (entry.State != EntityState.Deleted || entry.Entity.IdPessoa is not uint idPessoa)
                continue;
            var radical = _chaves.FotoPerfil(idPessoa);
            _depois.Add(ct => _arquivos.ExcluirAsync(radical, ct));
        }

        foreach (var entry in context.ChangeTracker.Entries<ConfiguracaoCondominio>())
        {
            if (entry.State != EntityState.Deleted || entry.Entity.IdCondominio is not uint idCondominio)
                continue;
            var login = _chaves.ImagemLogin(idCondominio);
            var icone = _chaves.ImagemIcone(idCondominio);
            _depois.Add(async ct =>
            {
                await _arquivos.ExcluirAsync(login, ct);
                await _arquivos.ExcluirAsync(icone, ct);
            });
        }

        foreach (var entry in context.ChangeTracker.Entries<OfertaConcorrencia>())
        {
            if (entry.State != EntityState.Deleted
                || entry.Entity.IdOfertaConcorrencia is not uint idOferta
                || entry.Entity.IdCondominio is not uint idCondominio)
                continue;
            var radical = _chaves.DocumentoComprobatorio(idCondominio, idOferta);
            _depois.Add(ct => _arquivos.ExcluirAsync(radical, ct));
        }

        foreach (var entry in context.ChangeTracker.Entries<PessoaUnidade>())
        {
            if (entry.State != EntityState.Deleted
                || entry.Entity.IdPessoa is not uint idPessoa
                || entry.Entity.IdUnidade is not uint idUnidade)
                continue;
            _depois.Add(ct => ExcluirProcuracaoAsync(idPessoa, idUnidade, ct));
        }

        foreach (var entry in context.ChangeTracker.Entries<TipoUnidade>())
        {
            if (entry.State != EntityState.Deleted
                || entry.Entity.IdTipoUnidade is not uint idTipoUnidade
                || entry.Entity.IdCondominio is not uint idCondominio)
                continue;
            var localizacao = _chaves.LocalizacaoUnidade(idCondominio, idTipoUnidade);
            var planta = _chaves.PlantaBaixa(idCondominio, idTipoUnidade);
            _depois.Add(async ct =>
            {
                await _arquivos.ExcluirAsync(localizacao, ct);
                await _arquivos.ExcluirAsync(planta, ct);
            });
        }
    }

    private async Task ExcluirProcuracaoAsync(uint idPessoa, uint idUnidade, CancellationToken ct)
    {
        using var scope = _scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var idCondominio = await db.Unidade.IgnoreQueryFilters().AsNoTracking()
            .Where(u => u.IdUnidade == idUnidade)
            .Select(u => u.IdCondominio)
            .FirstOrDefaultAsync(ct);
        if (idCondominio is not uint condo)
            return;
        await _arquivos.ExcluirAsync(_chaves.Procuracao(condo, idPessoa, idUnidade), ct);
    }

    private async Task FlushAsync(CancellationToken ct)
    {
        foreach (var job in _depois)
        {
            try
            {
                await job(ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Falha ao excluir arquivo no S3 após gravar o banco.");
            }
        }
        _depois.Clear();
    }
}
