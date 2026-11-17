using AppCondominium.Domain.Entities;
using AppCondominium.Domain.Vinculos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AppCondominium.Infrastructure.Persistence;

/// <summary>Garante papéis do hub, encerra papéis descontinuados e cria tabelas de colaborador.</summary>
public class PessoaContextoCatalogoBootstrap : IHostedService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<PessoaContextoCatalogoBootstrap> _logger;

    public PessoaContextoCatalogoBootstrap(IServiceProvider services, ILogger<PessoaContextoCatalogoBootstrap> logger)
    {
        _services = services;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            if (db.Database.IsRelational())
                await GarantirTabelasAsync(db, cancellationToken);
            await GarantirPapeisAsync(db, cancellationToken);
            await EncerrarPapeisExcluidosAsync(db, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Bootstrap do hub de pessoas não aplicado. A API segue no ar.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private static async Task GarantirTabelasAsync(AppDbContext db, CancellationToken ct)
    {
        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS `FuncaoColaborador` (
              `IdFuncaoColaborador` INT UNSIGNED NOT NULL AUTO_INCREMENT,
              `Descricao` VARCHAR(80) NOT NULL,
              PRIMARY KEY (`IdFuncaoColaborador`),
              UNIQUE KEY `uq_FuncaoColaborador_Descricao` (`Descricao`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """, ct);

        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS `Colaborador` (
              `IdColaborador` INT UNSIGNED NOT NULL AUTO_INCREMENT,
              `IdPessoa` INT UNSIGNED NOT NULL,
              `IdCondominio` INT UNSIGNED NOT NULL,
              `DataAdmissao` DATE NOT NULL,
              `DataDesligamento` DATE NULL,
              `CTPS` VARCHAR(20) NOT NULL,
              `TipoColaborador` TINYINT NOT NULL,
              `IdFuncaoColaborador` INT UNSIGNED NOT NULL,
              PRIMARY KEY (`IdColaborador`),
              KEY `idx_Colaborador_Pessoa` (`IdPessoa`, `IdCondominio`, `DataDesligamento`),
              CONSTRAINT `fk_Colaborador_IdPessoa` FOREIGN KEY (`IdPessoa`) REFERENCES `Pessoa` (`IdPessoa`),
              CONSTRAINT `fk_Colaborador_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`),
              CONSTRAINT `fk_Colaborador_IdFuncao` FOREIGN KEY (`IdFuncaoColaborador`) REFERENCES `FuncaoColaborador` (`IdFuncaoColaborador`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """, ct);
    }

    private static async Task GarantirPapeisAsync(AppDbContext db, CancellationToken ct)
    {
        var sementes = new (uint Codigo, string Descricao, byte Escopo)[]
        {
            (PapelVinculoCodigos.Visitante, "Visitante", EscopoPapelVinculo.Unidade),
            (PapelVinculoCodigos.Entregador, "Entregador", EscopoPapelVinculo.Condominio),
            (PapelVinculoCodigos.PrestadorUnidade, "Prestador (unidade)", EscopoPapelVinculo.Unidade),
            (PapelVinculoCodigos.PrestadorCondominio, "Prestador", EscopoPapelVinculo.Condominio),
            (PapelVinculoCodigos.Subsindico, "Subsíndico", EscopoPapelVinculo.Condominio),
            (PapelVinculoCodigos.Conselheiro, "Conselheiro", EscopoPapelVinculo.Condominio),
            (PapelVinculoCodigos.Administradora, "Administradora", EscopoPapelVinculo.Condominio),
            (PapelVinculoCodigos.Terceirizado, "Terceirizado", EscopoPapelVinculo.Condominio),
        };

        var existentes = await db.PapelVinculo.IgnoreQueryFilters().Select(p => p.CodigoPapelVinculo).ToListAsync(ct);
        foreach (var (codigo, descricao, escopo) in sementes)
        {
            if (existentes.Contains(codigo)) continue;
            db.PapelVinculo.Add(new PapelVinculo
            {
                CodigoPapelVinculo = codigo,
                Descricao = descricao,
                EscopoPapel = escopo
            });
        }
        await db.SaveChangesAsync(ct);
    }

    private static async Task EncerrarPapeisExcluidosAsync(AppDbContext db, CancellationToken ct)
    {
        var hoje = DateOnly.FromDateTime(DateTime.UtcNow);
        var abertos = await db.PessoaVinculo.IgnoreQueryFilters()
            .Where(v => v.CodigoPapelVinculo != null
                && PapelVinculoCodigos.PapeisExcluidos.Contains(v.CodigoPapelVinculo.Value)
                && v.DataFim == null)
            .ToListAsync(ct);
        if (abertos.Count == 0) return;
        foreach (var v in abertos)
            v.DataFim = v.DataInicio is DateOnly inicio && inicio > hoje ? inicio : hoje;
        await db.SaveChangesAsync(ct);
    }
}
