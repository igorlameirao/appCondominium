using System.Data;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace AppCondominium.Tools;

/// <summary>
/// Cria AlocacaoMaterial e EntradaSaidaMaterialConsumo no MySQL de forma idempotente.
/// Use: dotnet run --project WebApi/AppCondominium.Tools -- migrate-material-tables
/// </summary>
public static class MaterialTablesMigration
{
    private static readonly string[] PrerequisitosEntradaSaida =
    [
        "Condominio", "EstoqueMaterialConsumo", "TipoMaterial", "PessoaVinculo"
    ];

    private static readonly string[] PrerequisitosAlocacao =
    [
        "Condominio", "Material", "PessoaVinculo", "Local"
    ];

    public static async Task<int> InspectAsync(IServiceProvider services, ILogger logger, CancellationToken ct)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        foreach (var table in new[] { "AlocacaoMaterial", "EntradaSaidaMaterialConsumo", "GuardaEncomenda" })
        {
            if (!await TableExistsAsync(db, table, ct))
            {
                logger.LogWarning("{Table}: não existe.", table);
                continue;
            }

            var cols = await ListColumnsAsync(db, table, ct);
            logger.LogInformation("{Table} ({Count} colunas): {Columns}", table, cols.Count, string.Join(", ", cols));
        }

        return 0;
    }

    public static async Task<int> EnsureAsync(IServiceProvider services, ILogger logger, CancellationToken ct)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var conn = db.Database.GetDbConnection().ConnectionString;
        if (string.IsNullOrWhiteSpace(conn) || conn.Contains("Server=;", StringComparison.OrdinalIgnoreCase))
        {
            logger.LogError(
                "ConnectionStrings:DefaultConnection não configurada. Use user-secrets em WebApi/AppCondominium.API " +
                "(dotnet user-secrets set \"ConnectionStrings:DefaultConnection\" \"...\" --id app-condominium-api-2026).");
            return 1;
        }

        var dbName = await ScalarStringAsync(db, "SELECT DATABASE()", ct);
        var host = db.Database.GetDbConnection().DataSource;
        logger.LogInformation("Conexão — host: {Host}, database: {Db}", host, dbName);

        if (string.IsNullOrWhiteSpace(dbName))
        {
            logger.LogError("Nenhum database selecionado na connection string (falta Database=...).");
            return 1;
        }

        await EnsureAlocacaoMaterialAsync(db, logger, ct);
        await EnsureEntradaSaidaMaterialConsumoAsync(db, logger, ct);
        await EnsureGuardaEncomendaAsync(db, logger, ct);
        await RepairMissingColumnsAsync(db, logger, ct);

        logger.LogInformation(
            "Migração concluída. AlocacaoMaterial: {A}, EntradaSaidaMaterialConsumo: {E}, GuardaEncomenda: {G}.",
            await TableExistsAsync(db, "AlocacaoMaterial", ct) ? "ok" : "ausente",
            await TableExistsAsync(db, "EntradaSaidaMaterialConsumo", ct) ? "ok" : "ausente",
            await TableExistsAsync(db, "GuardaEncomenda", ct) ? "ok" : "ausente");
        return 0;
    }

    private static async Task RepairMissingColumnsAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        if (await TableExistsAsync(db, "AlocacaoMaterial", ct))
        {
            await EnsureColumnAsync(db, logger, "AlocacaoMaterial", "IdCondominio", "INT UNSIGNED NOT NULL", ct);
            await EnsureColumnAsync(db, logger, "AlocacaoMaterial", "IdMaterial", "INT UNSIGNED NOT NULL", ct);
            await EnsureColumnAsync(db, logger, "AlocacaoMaterial", "IdLocal", "INT UNSIGNED NOT NULL", ct);
            await EnsureColumnAsync(db, logger, "AlocacaoMaterial", "DataHoraInicio", "DATETIME NOT NULL", ct);
            await EnsureColumnAsync(db, logger, "AlocacaoMaterial", "DataHoraFim", "DATETIME NULL", ct);
            await MigrarIdPessoaParaIdVinculoAsync(db, logger, "AlocacaoMaterial", ct);
            await EnsureColumnAsync(db, logger, "AlocacaoMaterial", "IdVinculo", "INT UNSIGNED NULL", ct);
        }

        if (await TableExistsAsync(db, "EntradaSaidaMaterialConsumo", ct))
        {
            await EnsureColumnAsync(db, logger, "EntradaSaidaMaterialConsumo", "IdCondominio", "INT UNSIGNED NOT NULL", ct);
            await EnsureColumnAsync(db, logger, "EntradaSaidaMaterialConsumo", "TipoLancamento", "TINYINT UNSIGNED NOT NULL", ct);
            await EnsureColumnAsync(db, logger, "EntradaSaidaMaterialConsumo", "IdEstoqueMaterialConsumo", "INT UNSIGNED NOT NULL", ct);
            await EnsureColumnAsync(db, logger, "EntradaSaidaMaterialConsumo", "IdTipoMaterial", "INT UNSIGNED NOT NULL", ct);
            await EnsureColumnAsync(db, logger, "EntradaSaidaMaterialConsumo", "DataValidade", "DATETIME NULL", ct);
            await EnsureColumnAsync(db, logger, "EntradaSaidaMaterialConsumo", "Lote", "VARCHAR(20) NULL", ct);
            await EnsureColumnAsync(db, logger, "EntradaSaidaMaterialConsumo", "ValorUnitarioAquisicao", "DECIMAL(10,2) UNSIGNED NULL", ct);
            await EnsureColumnAsync(db, logger, "EntradaSaidaMaterialConsumo", "Quantidade", "DECIMAL(10,3) UNSIGNED NOT NULL", ct);
            await EnsureColumnAsync(db, logger, "EntradaSaidaMaterialConsumo", "UnidadeMedida", "TINYINT UNSIGNED NOT NULL", ct);
            await MigrarIdPessoaParaIdVinculoAsync(db, logger, "EntradaSaidaMaterialConsumo", ct);
            await EnsureColumnAsync(db, logger, "EntradaSaidaMaterialConsumo", "IdVinculo", "INT UNSIGNED NULL", ct);
        }

        if (await TableExistsAsync(db, "AlocacaoMaterial", ct))
        {
            await TryAddFk(db, logger,
                "ALTER TABLE `AlocacaoMaterial` ADD CONSTRAINT `fk_AlocacaoMaterial_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT", ct);
            await TryAddFk(db, logger,
                "ALTER TABLE `AlocacaoMaterial` ADD CONSTRAINT `fk_AlocacaoMaterial_IdMaterial` FOREIGN KEY (`IdMaterial`) REFERENCES `Material` (`IdMaterial`) ON UPDATE CASCADE ON DELETE RESTRICT", ct);
            await TryAddFk(db, logger,
                "ALTER TABLE `AlocacaoMaterial` ADD CONSTRAINT `fk_AlocacaoMaterial_IdVinculo` FOREIGN KEY (`IdVinculo`) REFERENCES `PessoaVinculo` (`IdVinculo`) ON UPDATE CASCADE ON DELETE RESTRICT", ct);
            await TryAddFk(db, logger,
                "ALTER TABLE `AlocacaoMaterial` ADD CONSTRAINT `fk_AlocacaoMaterial_IdLocal` FOREIGN KEY (`IdLocal`) REFERENCES `Local` (`IdLocal`) ON UPDATE CASCADE ON DELETE RESTRICT", ct);
        }

        if (await TableExistsAsync(db, "EntradaSaidaMaterialConsumo", ct))
        {
            await TryAddFk(db, logger,
                "ALTER TABLE `EntradaSaidaMaterialConsumo` ADD CONSTRAINT `fk_EntradaSaidaMaterialConsumo_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT", ct);
            await TryAddFk(db, logger,
                "ALTER TABLE `EntradaSaidaMaterialConsumo` ADD CONSTRAINT `fk_EntradaSaidaMaterialConsumo_IdEstoqueMaterialConsumo` FOREIGN KEY (`IdEstoqueMaterialConsumo`) REFERENCES `EstoqueMaterialConsumo` (`IdEstoqueMaterialConsumo`) ON UPDATE CASCADE ON DELETE RESTRICT", ct);
            await TryAddFk(db, logger,
                "ALTER TABLE `EntradaSaidaMaterialConsumo` ADD CONSTRAINT `fk_EntradaSaidaMaterialConsumo_IdTipoMaterial` FOREIGN KEY (`IdTipoMaterial`) REFERENCES `TipoMaterial` (`IdTipoMaterial`) ON UPDATE CASCADE ON DELETE RESTRICT", ct);
            await TryAddFk(db, logger,
                "ALTER TABLE `EntradaSaidaMaterialConsumo` ADD CONSTRAINT `fk_EntradaSaidaMaterialConsumo_IdVinculo` FOREIGN KEY (`IdVinculo`) REFERENCES `PessoaVinculo` (`IdVinculo`) ON UPDATE CASCADE ON DELETE RESTRICT", ct);
        }

        if (await TableExistsAsync(db, "GuardaEncomenda", ct))
        {
            await MigrarIdPessoaSaidaParaIdVinculoRetiradaAsync(db, logger, ct);
            await EnsureColumnAsync(db, logger, "GuardaEncomenda", "IdVinculoRetirada", "INT UNSIGNED NULL", ct);
            await TryAddFk(db, logger,
                "ALTER TABLE `GuardaEncomenda` ADD CONSTRAINT `fk_GuardaEncomenda_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT", ct);
            await TryAddFk(db, logger,
                "ALTER TABLE `GuardaEncomenda` ADD CONSTRAINT `fk_GuardaEncomenda_IdUnidade` FOREIGN KEY (`IdUnidade`) REFERENCES `Unidade` (`IdUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT", ct);
            await TryAddFk(db, logger,
                "ALTER TABLE `GuardaEncomenda` ADD CONSTRAINT `fk_GuardaEncomenda_IdLocal` FOREIGN KEY (`IdLocal`) REFERENCES `Local` (`IdLocal`) ON UPDATE CASCADE ON DELETE RESTRICT", ct);
            await TryAddFk(db, logger,
                "ALTER TABLE `GuardaEncomenda` ADD CONSTRAINT `fk_GuardaEncomenda_IdPessoaEntrada` FOREIGN KEY (`IdPessoaEntrada`) REFERENCES `Pessoa` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT", ct);
            await TryAddFk(db, logger,
                "ALTER TABLE `GuardaEncomenda` ADD CONSTRAINT `fk_GuardaEncomenda_IdVinculoRetirada` FOREIGN KEY (`IdVinculoRetirada`) REFERENCES `PessoaVinculo` (`IdVinculo`) ON UPDATE CASCADE ON DELETE RESTRICT", ct);
        }
    }

    /// <summary>Schema legado usava IdPessoa; o modelo atual usa IdVinculo (PessoaVinculo).</summary>
    private static async Task MigrarIdPessoaParaIdVinculoAsync(
        AppDbContext db, ILogger logger, string table, CancellationToken ct)
    {
        if (!await ColumnExistsAsync(db, table, "IdPessoa", ct))
            return;

        await EnsureColumnAsync(db, logger, table, "IdVinculo", "INT UNSIGNED NULL", ct);

        var hoje = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd");
        var sql = $"""
            UPDATE `{table}` t
            INNER JOIN `PessoaVinculo` v
              ON v.`IdPessoa` = t.`IdPessoa` AND v.`IdCondominio` = t.`IdCondominio`
             AND v.`DataInicio` <= '{hoje}'
             AND (v.`DataFim` IS NULL OR v.`DataFim` >= '{hoje}')
            SET t.`IdVinculo` = v.`IdVinculo`
            WHERE t.`IdVinculo` IS NULL AND t.`IdPessoa` IS NOT NULL
            """;
        try
        {
            var n = await db.Database.ExecuteSqlRawAsync(sql, ct);
            logger.LogInformation("{Table}: IdPessoa → IdVinculo, linhas atualizadas: {Rows}", table, n);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "{Table}: não foi possível mapear IdPessoa para IdVinculo.", table);
        }
    }

    /// <summary>Schema legado em GuardaEncomenda usava IdPessoaSaida; o modelo atual usa IdVinculoRetirada.</summary>
    private static async Task MigrarIdPessoaSaidaParaIdVinculoRetiradaAsync(
        AppDbContext db, ILogger logger, CancellationToken ct)
    {
        const string table = "GuardaEncomenda";
        if (!await ColumnExistsAsync(db, table, "IdPessoaSaida", ct))
            return;

        await EnsureColumnAsync(db, logger, table, "IdVinculoRetirada", "INT UNSIGNED NULL", ct);

        var hoje = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd");
        var sql = $"""
            UPDATE `{table}` t
            INNER JOIN `PessoaVinculo` v
              ON v.`IdPessoa` = t.`IdPessoaSaida` AND v.`IdCondominio` = t.`IdCondominio`
             AND v.`DataInicio` <= '{hoje}'
             AND (v.`DataFim` IS NULL OR v.`DataFim` >= '{hoje}')
            SET t.`IdVinculoRetirada` = v.`IdVinculo`
            WHERE t.`IdVinculoRetirada` IS NULL AND t.`IdPessoaSaida` IS NOT NULL
            """;
        try
        {
            var n = await db.Database.ExecuteSqlRawAsync(sql, ct);
            logger.LogInformation("{Table}: IdPessoaSaida → IdVinculoRetirada, linhas atualizadas: {Rows}", table, n);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "{Table}: não foi possível mapear IdPessoaSaida para IdVinculoRetirada.", table);
        }
    }

    private static async Task EnsureGuardaEncomendaAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        foreach (var t in new[] { "Condominio", "Unidade", "Pessoa", "PessoaVinculo", "Local" })
        {
            if (!await TableExistsAsync(db, t, ct))
            {
                logger.LogError("Pré-requisito ausente para GuardaEncomenda: tabela `{Table}` não existe.", t);
                return;
            }
        }

        if (await TableExistsAsync(db, "GuardaEncomenda", ct))
        {
            logger.LogInformation("Tabela GuardaEncomenda já existe.");
            return;
        }

        const string create = """
            CREATE TABLE `GuardaEncomenda` (
              `IdGuardaEncomenda` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
              `IdCondominio` INT UNSIGNED NOT NULL,
              `IdUnidade` INT UNSIGNED NOT NULL,
              `CodigoEncomenda` VARCHAR(255) NOT NULL,
              `IdLocal` INT UNSIGNED NULL,
              `DataHoraEntrada` DATETIME NOT NULL,
              `DataHoraSaida` DATETIME NULL,
              `IdPessoaEntrada` INT UNSIGNED NOT NULL,
              `IdVinculoRetirada` INT UNSIGNED NULL,
              PRIMARY KEY (`IdGuardaEncomenda`),
              KEY `idx_GuardaEncomenda_CodigoEncomenda` (`CodigoEncomenda`),
              KEY `idx_GuardaEncomenda_DataHoraEntrada` (`DataHoraEntrada`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """;
        await Exec(db, logger, create, ct);
        logger.LogInformation("Tabela GuardaEncomenda criada.");
    }

    private static async Task EnsureColumnAsync(
        AppDbContext db, ILogger logger, string table, string column, string definition, CancellationToken ct)
    {
        if (await ColumnExistsAsync(db, table, column, ct))
            return;

        var sql = $"ALTER TABLE `{table}` ADD COLUMN `{column}` {definition}";
        logger.LogInformation("Adicionando coluna ausente: {Table}.{Column}", table, column);
        try
        {
            await db.Database.ExecuteSqlRawAsync(sql, ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Falha ao adicionar {Table}.{Column}: {Message}", table, column, ex.Message);
        }
    }

    private static async Task EnsureAlocacaoMaterialAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        foreach (var t in PrerequisitosAlocacao)
        {
            if (!await TableExistsAsync(db, t, ct))
            {
                logger.LogError("Pré-requisito ausente para AlocacaoMaterial: tabela `{Table}` não existe.", t);
                return;
            }
        }

        if (!await TableExistsAsync(db, "AlocacaoMaterial", ct))
        {
            const string create = """
                CREATE TABLE `AlocacaoMaterial` (
                  `IdAlocacaoMaterial` INT UNSIGNED NOT NULL AUTO_INCREMENT,
                  `IdCondominio` INT UNSIGNED NOT NULL,
                  `IdMaterial` INT UNSIGNED NOT NULL,
                  `IdVinculo` INT UNSIGNED NOT NULL,
                  `IdLocal` INT UNSIGNED NOT NULL,
                  `DataHoraInicio` DATETIME NOT NULL,
                  `DataHoraFim` DATETIME NULL,
                  PRIMARY KEY (`IdAlocacaoMaterial`),
                  KEY `idx_AlocacaoMaterial_DataHoraInicio` (`DataHoraInicio`),
                  KEY `idx_AlocacaoMaterial_DataHoraFim` (`DataHoraFim`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """;
            await Exec(db, logger, create, ct);
            logger.LogInformation("Tabela AlocacaoMaterial criada.");
        }
        else
        {
            logger.LogInformation("Tabela AlocacaoMaterial já existe.");
        }

    }

    private static async Task EnsureEntradaSaidaMaterialConsumoAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        foreach (var t in PrerequisitosEntradaSaida)
        {
            if (!await TableExistsAsync(db, t, ct))
            {
                logger.LogError("Pré-requisito ausente para EntradaSaidaMaterialConsumo: tabela `{Table}` não existe.", t);
                return;
            }
        }

        if (!await TableExistsAsync(db, "EntradaSaidaMaterialConsumo", ct))
        {
            const string create = """
                CREATE TABLE `EntradaSaidaMaterialConsumo` (
                  `IdEntradaSaidaMaterialConsumo` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                  `IdCondominio` INT UNSIGNED NOT NULL,
                  `TipoLancamento` TINYINT UNSIGNED NOT NULL,
                  `IdEstoqueMaterialConsumo` INT UNSIGNED NOT NULL,
                  `IdTipoMaterial` INT UNSIGNED NOT NULL,
                  `DataValidade` DATETIME NULL,
                  `Lote` VARCHAR(20) NULL,
                  `ValorUnitarioAquisicao` DECIMAL(10,2) UNSIGNED NULL,
                  `Quantidade` DECIMAL(10,3) UNSIGNED NOT NULL,
                  `UnidadeMedida` TINYINT UNSIGNED NOT NULL,
                  `IdVinculo` INT UNSIGNED NULL,
                  PRIMARY KEY (`IdEntradaSaidaMaterialConsumo`),
                  KEY `idx_EntradaSaidaMaterialConsumo_DataValidade` (`DataValidade`),
                  KEY `idx_EntradaSaidaMaterialConsumo_Lote` (`Lote`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """;
            await Exec(db, logger, create, ct);
            logger.LogInformation("Tabela EntradaSaidaMaterialConsumo criada.");
        }
        else
        {
            logger.LogInformation("Tabela EntradaSaidaMaterialConsumo já existe.");
        }

    }

    private static async Task<bool> ColumnExistsAsync(AppDbContext db, string table, string column, CancellationToken ct)
    {
        var n = await ScalarLongAsync(db, """
            SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @p0 AND COLUMN_NAME = @p1
            """, ct, table, column);
        return n > 0;
    }

    private static async Task<List<string>> ListColumnsAsync(AppDbContext db, string table, CancellationToken ct)
    {
        await using var cmd = db.Database.GetDbConnection().CreateCommand();
        cmd.CommandText = """
            SELECT COLUMN_NAME FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @p0
            ORDER BY ORDINAL_POSITION
            """;
        var p = cmd.CreateParameter();
        p.ParameterName = "@p0";
        p.Value = table;
        cmd.Parameters.Add(p);
        if (cmd.Connection!.State != ConnectionState.Open)
            await db.Database.OpenConnectionAsync(ct);

        var list = new List<string>();
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
            list.Add(reader.GetString(0));
        return list;
    }

    private static async Task<bool> TableExistsAsync(AppDbContext db, string table, CancellationToken ct)
    {
        var n = await ScalarLongAsync(db, """
            SELECT COUNT(*) FROM information_schema.tables
            WHERE table_schema = DATABASE() AND table_name = @p0
            """, ct, table);
        return n > 0;
    }

    private static async Task Exec(AppDbContext db, ILogger logger, string sql, CancellationToken ct)
    {
        logger.LogInformation("Executando DDL...");
        try
        {
            await db.Database.ExecuteSqlRawAsync(sql, ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Falha no DDL: {Message}", ex.Message);
            throw;
        }
    }

    private static async Task TryAddFk(AppDbContext db, ILogger logger, string sql, CancellationToken ct)
    {
        try
        {
            await db.Database.ExecuteSqlRawAsync(sql, ct);
        }
        catch (Exception ex) when (ex.Message.Contains("Duplicate", StringComparison.OrdinalIgnoreCase)
                                     || ex.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase)
                                     || ex.Message.Contains("check that column/key exists", StringComparison.OrdinalIgnoreCase))
        {
            logger.LogDebug("FK ignorada (já existe ou incompatível): {Msg}", ex.Message);
        }
        catch (Exception ex)
        {
            logger.LogWarning("Não foi possível criar FK: {Msg}", ex.Message);
        }
    }

    private static async Task<string?> ScalarStringAsync(AppDbContext db, string sql, CancellationToken ct)
    {
        await using var cmd = db.Database.GetDbConnection().CreateCommand();
        cmd.CommandText = sql;
        if (cmd.Connection!.State != ConnectionState.Open)
            await db.Database.OpenConnectionAsync(ct);
        var o = await cmd.ExecuteScalarAsync(ct);
        return o?.ToString();
    }

    private static async Task<long> ScalarLongAsync(AppDbContext db, string sql, CancellationToken ct, params object[] args)
    {
        await using var cmd = db.Database.GetDbConnection().CreateCommand();
        cmd.CommandText = sql;
        for (var i = 0; i < args.Length; i++)
        {
            var p = cmd.CreateParameter();
            p.ParameterName = $"@p{i}";
            p.Value = args[i];
            cmd.Parameters.Add(p);
        }

        if (cmd.Connection!.State != ConnectionState.Open)
            await db.Database.OpenConnectionAsync(ct);
        var o = await cmd.ExecuteScalarAsync(ct);
        return o is null or DBNull ? 0 : Convert.ToInt64(o);
    }
}