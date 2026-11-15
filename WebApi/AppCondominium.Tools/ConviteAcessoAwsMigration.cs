using System.Data;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace AppCondominium.Tools;

/// <summary>
/// Cria a tabela ConviteAcesso no RDS (database <c>condominium</c>) de forma não destrutiva.
/// Execute apenas via <c>migrate-convite-acesso</c> — não altera RBAC nem outras tabelas.
/// </summary>
public static class ConviteAcessoAwsMigration
{
    private const string TableName = "ConviteAcesso";

    private static readonly string[] ExpectedColumns =
    [
        "IdConvite", "IdCondominio", "IdPessoaDestinatario", "EmailDestinatario", "CpfDestinatario",
        "TipoConvite", "CodigoPapelVinculo", "IdPerfil", "IdUnidade", "IdPessoaRelacionada",
        "TokenHash", "DataEmissao", "DataExpiracao", "Estado", "IdPessoaEmissor", "DataAceite",
        "IdVinculoCriado", "IdConviteAnterior",         "EstadoEnvioEmail", "TentativasEnvioEmail", "IdEmailQueue",
        "UltimoErroEnvio", "Observacao"
    ];

    private static readonly string[] ExpectedForeignKeys =
    [
        "fk_ConviteAcesso_IdCondominio", "fk_ConviteAcesso_IdPessoaDestinatario",
        "fk_ConviteAcesso_CodigoPapelVinculo", "fk_ConviteAcesso_IdPerfil", "fk_ConviteAcesso_IdUnidade",
        "fk_ConviteAcesso_IdPessoaRelacionada", "fk_ConviteAcesso_IdPessoaEmissor",
        "fk_ConviteAcesso_IdVinculoCriado", "fk_ConviteAcesso_IdConviteAnterior"
    ];

    private static readonly (string Name, string Sql)[] ExpectedSecondaryIndexes =
    [
        ("IdxConviteAcessoPendenteDest",
            "ALTER TABLE `ConviteAcesso` ADD INDEX `IdxConviteAcessoPendenteDest` (`IdCondominio`, `EmailDestinatario`, `Estado`)"),
        ("idx_ConviteAcesso_EmailDestinatario",
            "ALTER TABLE `ConviteAcesso` ADD INDEX `idx_ConviteAcesso_EmailDestinatario` (`EmailDestinatario`)"),
        ("idx_ConviteAcesso_CpfDestinatario",
            "ALTER TABLE `ConviteAcesso` ADD INDEX `idx_ConviteAcesso_CpfDestinatario` (`CpfDestinatario`)"),
        ("idx_ConviteAcesso_TipoConvite",
            "ALTER TABLE `ConviteAcesso` ADD INDEX `idx_ConviteAcesso_TipoConvite` (`TipoConvite`)"),
        ("idx_ConviteAcesso_DataEmissao",
            "ALTER TABLE `ConviteAcesso` ADD INDEX `idx_ConviteAcesso_DataEmissao` (`DataEmissao`)"),
        ("idx_ConviteAcesso_DataExpiracao",
            "ALTER TABLE `ConviteAcesso` ADD INDEX `idx_ConviteAcesso_DataExpiracao` (`DataExpiracao`)"),
        ("idx_ConviteAcesso_Estado",
            "ALTER TABLE `ConviteAcesso` ADD INDEX `idx_ConviteAcesso_Estado` (`Estado`)"),
        ("idx_ConviteAcesso_EstadoEnvioEmail",
            "ALTER TABLE `ConviteAcesso` ADD INDEX `idx_ConviteAcesso_EstadoEnvioEmail` (`EstadoEnvioEmail`)")
    ];

    public static async Task<int> EnsureAsync(IServiceProvider services, ILogger logger, CancellationToken ct)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await LogDatabaseIdentityAsync(db, logger, ct);

        var existedBefore = await TableExistsAsync(db, TableName, ct);
        if (existedBefore)
            logger.LogInformation("Tabela {Table} já existe — estrutura será verificada após o DDL.", TableName);

        await EnsureTableAsync(db, logger, ct);
        await EnsureSecondaryIndexesAsync(db, logger, ct);

        var divergences = await CollectStructureDivergencesAsync(db, logger, ct);
        if (divergences.Count == 0)
        {
            logger.LogInformation("Tabela ConviteAcesso alinhada com database/schema.sql.");
            return 0;
        }

        foreach (var d in divergences)
            logger.LogWarning("Divergência ConviteAcesso: {Detail}", d);

        logger.LogError(
            "ConviteAcesso possui {Count} divergência(s) em relação ao schema esperado. Corrija manualmente ou ajuste o DDL antes de usar a API em produção.",
            divergences.Count);
        return 1;
    }

    private static async Task LogDatabaseIdentityAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        var dbName = await ScalarStringAsync(db, "SELECT DATABASE()", ct);
        var host = db.Database.GetDbConnection().DataSource;
        logger.LogInformation("Conexão ativa — host/tunnel: {Host}, database: {Db}", host, dbName);
        if (!string.Equals(dbName, "condominium", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"Database inesperado: '{dbName}'. Esperado 'condominium'.");
    }

    private static async Task EnsureTableAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        const string sql = """
            CREATE TABLE IF NOT EXISTS `ConviteAcesso` (
              `IdConvite` int unsigned NOT NULL AUTO_INCREMENT,
              `IdCondominio` int unsigned NOT NULL,
              `IdPessoaDestinatario` int unsigned DEFAULT NULL,
              `EmailDestinatario` varchar(255) NOT NULL,
              `CpfDestinatario` varchar(11) DEFAULT NULL,
              `TipoConvite` tinyint unsigned NOT NULL,
              `CodigoPapelVinculo` int unsigned NOT NULL,
              `IdPerfil` int unsigned DEFAULT NULL,
              `IdUnidade` int unsigned DEFAULT NULL,
              `IdPessoaRelacionada` int unsigned DEFAULT NULL,
              `TokenHash` varchar(64) NOT NULL,
              `DataEmissao` datetime NOT NULL,
              `DataExpiracao` datetime NOT NULL,
              `Estado` tinyint unsigned NOT NULL,
              `IdPessoaEmissor` int unsigned NOT NULL,
              `DataAceite` datetime DEFAULT NULL,
              `IdVinculoCriado` int unsigned DEFAULT NULL,
              `IdConviteAnterior` int unsigned DEFAULT NULL,
              `EstadoEnvioEmail` tinyint unsigned NOT NULL,
              `TentativasEnvioEmail` int unsigned NOT NULL,
              `IdEmailQueue` bigint DEFAULT NULL,
              `UltimoErroEnvio` varchar(500) DEFAULT NULL,
              `Observacao` varchar(500) DEFAULT NULL,
              PRIMARY KEY (`IdConvite`),
              UNIQUE KEY `uq_ConviteAcesso_TokenHash` (`TokenHash`),
              KEY `IdxConviteAcessoPendenteDest` (`IdCondominio`,`EmailDestinatario`,`Estado`),
              KEY `idx_ConviteAcesso_EmailDestinatario` (`EmailDestinatario`),
              KEY `idx_ConviteAcesso_CpfDestinatario` (`CpfDestinatario`),
              KEY `idx_ConviteAcesso_TipoConvite` (`TipoConvite`),
              KEY `idx_ConviteAcesso_DataEmissao` (`DataEmissao`),
              KEY `idx_ConviteAcesso_DataExpiracao` (`DataExpiracao`),
              KEY `idx_ConviteAcesso_Estado` (`Estado`),
              KEY `idx_ConviteAcesso_EstadoEnvioEmail` (`EstadoEnvioEmail`),
              CONSTRAINT `fk_ConviteAcesso_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT,
              CONSTRAINT `fk_ConviteAcesso_IdPessoaDestinatario` FOREIGN KEY (`IdPessoaDestinatario`) REFERENCES `Pessoa` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT,
              CONSTRAINT `fk_ConviteAcesso_CodigoPapelVinculo` FOREIGN KEY (`CodigoPapelVinculo`) REFERENCES `PapelVinculo` (`CodigoPapelVinculo`) ON UPDATE CASCADE ON DELETE RESTRICT,
              CONSTRAINT `fk_ConviteAcesso_IdPerfil` FOREIGN KEY (`IdPerfil`) REFERENCES `PerfilAcesso` (`IdPerfil`) ON UPDATE CASCADE ON DELETE RESTRICT,
              CONSTRAINT `fk_ConviteAcesso_IdUnidade` FOREIGN KEY (`IdUnidade`) REFERENCES `Unidade` (`IdUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT,
              CONSTRAINT `fk_ConviteAcesso_IdPessoaRelacionada` FOREIGN KEY (`IdPessoaRelacionada`) REFERENCES `Pessoa` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT,
              CONSTRAINT `fk_ConviteAcesso_IdPessoaEmissor` FOREIGN KEY (`IdPessoaEmissor`) REFERENCES `Pessoa` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT,
              CONSTRAINT `fk_ConviteAcesso_IdVinculoCriado` FOREIGN KEY (`IdVinculoCriado`) REFERENCES `PessoaVinculo` (`IdVinculo`) ON UPDATE CASCADE ON DELETE RESTRICT,
              CONSTRAINT `fk_ConviteAcesso_IdConviteAnterior` FOREIGN KEY (`IdConviteAnterior`) REFERENCES `ConviteAcesso` (`IdConvite`) ON UPDATE CASCADE ON DELETE RESTRICT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """;

        logger.LogInformation("Garantindo DDL de {Table} (CREATE TABLE IF NOT EXISTS)...", TableName);
        await db.Database.ExecuteSqlRawAsync(sql, ct);
    }

    private static async Task EnsureSecondaryIndexesAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        if (!await TableExistsAsync(db, TableName, ct))
            return;

        var present = await ListIndexNamesAsync(db, ct);
        foreach (var (name, alterSql) in ExpectedSecondaryIndexes)
        {
            if (present.Contains(name, StringComparer.OrdinalIgnoreCase))
                continue;
            await TryAddIndexAsync(db, logger, alterSql, name, ct);
        }

        if (!present.Contains("uq_ConviteAcesso_TokenHash", StringComparer.OrdinalIgnoreCase))
            logger.LogWarning("Índice único uq_ConviteAcesso_TokenHash ausente — exige intervenção manual se a tabela já existia.");
    }

    private static async Task<List<string>> CollectStructureDivergencesAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        var issues = new List<string>();
        if (!await TableExistsAsync(db, TableName, ct))
        {
            issues.Add("tabela ausente após CREATE");
            return issues;
        }

        var cols = await ListColumnNamesAsync(db, ct);
        foreach (var expected in ExpectedColumns)
        {
            if (!cols.Contains(expected, StringComparer.OrdinalIgnoreCase))
                issues.Add($"coluna ausente: {expected}");
        }

        var indexes = await ListIndexNamesAsync(db, ct);
        if (!indexes.Contains("uq_ConviteAcesso_TokenHash", StringComparer.OrdinalIgnoreCase))
            issues.Add("índice único ausente: uq_ConviteAcesso_TokenHash");

        foreach (var (name, _) in ExpectedSecondaryIndexes)
        {
            if (!indexes.Contains(name, StringComparer.OrdinalIgnoreCase))
                issues.Add($"índice ausente: {name}");
        }

        var fks = await ListForeignKeyNamesAsync(db, ct);
        foreach (var expected in ExpectedForeignKeys)
        {
            if (!fks.Contains(expected, StringComparer.OrdinalIgnoreCase))
                issues.Add($"FK ausente: {expected}");
        }

        var cnt = await ScalarLongAsync(db, $"SELECT COUNT(*) FROM `{TableName}`", ct);
        logger.LogInformation("ConviteAcesso: {Count} registro(s), {ColCount} coluna(s) no catálogo.", cnt, cols.Count);

        return issues;
    }

    private static async Task TryAddIndexAsync(AppDbContext db, ILogger logger, string sql, string indexName, CancellationToken ct)
    {
        try
        {
            logger.LogInformation("Adicionando índice {Index}...", indexName);
            await db.Database.ExecuteSqlRawAsync(sql, ct);
        }
        catch (Exception ex) when (ex.Message.Contains("Duplicate", StringComparison.OrdinalIgnoreCase)
                                   || ex.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase))
        {
            logger.LogWarning("Índice {Index} já existente.", indexName);
        }
    }

    private static async Task<bool> TableExistsAsync(AppDbContext db, string table, CancellationToken ct)
    {
        var n = await ScalarLongAsync(db, """
            SELECT COUNT(*) FROM information_schema.tables
            WHERE table_schema = DATABASE() AND table_name = @p0
            """, ct, table);
        return n > 0;
    }

    private static async Task<HashSet<string>> ListColumnNamesAsync(AppDbContext db, CancellationToken ct)
    {
        var rows = await QueryAsync(db, """
            SELECT COLUMN_NAME FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ConviteAcesso'
            ORDER BY ORDINAL_POSITION
            """, ct);
        return rows.Select(r => r[0]).ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    private static async Task<HashSet<string>> ListIndexNamesAsync(AppDbContext db, CancellationToken ct)
    {
        var rows = await QueryAsync(db, """
            SELECT DISTINCT INDEX_NAME FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ConviteAcesso'
            """, ct);
        return rows.Select(r => r[0]).ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    private static async Task<HashSet<string>> ListForeignKeyNamesAsync(AppDbContext db, CancellationToken ct)
    {
        var rows = await QueryAsync(db, """
            SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ConviteAcesso' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
            """, ct);
        return rows.Select(r => r[0]).ToHashSet(StringComparer.OrdinalIgnoreCase);
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
            await cmd.Connection.OpenAsync(ct);
        var r = await cmd.ExecuteScalarAsync(ct);
        return r is null or DBNull ? 0 : Convert.ToInt64(r);
    }

    private static async Task<string?> ScalarStringAsync(AppDbContext db, string sql, CancellationToken ct)
    {
        await using var cmd = db.Database.GetDbConnection().CreateCommand();
        cmd.CommandText = sql;
        if (cmd.Connection!.State != ConnectionState.Open)
            await cmd.Connection.OpenAsync(ct);
        var r = await cmd.ExecuteScalarAsync(ct);
        return r?.ToString();
    }

    private static async Task<List<string[]>> QueryAsync(AppDbContext db, string sql, CancellationToken ct)
    {
        var rows = new List<string[]>();
        await using var cmd = db.Database.GetDbConnection().CreateCommand();
        cmd.CommandText = sql;
        if (cmd.Connection!.State != ConnectionState.Open)
            await cmd.Connection.OpenAsync(ct);
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            var row = new string[reader.FieldCount];
            for (var i = 0; i < reader.FieldCount; i++)
                row[i] = reader.IsDBNull(i) ? "" : reader.GetValue(i).ToString() ?? "";
            rows.Add(row);
        }

        return rows;
    }
}