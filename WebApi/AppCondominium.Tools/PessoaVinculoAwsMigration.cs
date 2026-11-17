using System.Data;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace AppCondominium.Tools;

/// <summary>Migração incremental PessoaVinculo / Fornecedor no RDS (condominium).</summary>
public static class PessoaVinculoAwsMigration
{
    public static async Task<int> InspectAsync(IServiceProvider services, ILogger logger, CancellationToken ct)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await LogDatabaseIdentityAsync(db, logger, ct);
        foreach (var t in new[]
                 {
                     "PapelVinculo", "PessoaVinculo", "AutorizacaoAcessoTemporario", "Fornecedor",
                     "PessoaCondominio", "PessoaUnidade", "Despesa", "GuardaEncomenda", "AlocacaoMaterial",
                     "EntradaSaidaMaterialConsumo"
                 })
        {
            if (!await TableExistsAsync(db, t, ct))
            {
                logger.LogInformation("Tabela {Table}: ausente", t);
                continue;
            }

            var cnt = await ScalarLongAsync(db, $"SELECT COUNT(*) FROM `{t}`", ct);
            logger.LogInformation("Tabela {Table}: {Count} registros", t, cnt);
        }

        if (await TableExistsAsync(db, "PapelVinculo", ct))
        {
            var papeis = await ScalarLongAsync(db, "SELECT COUNT(*) FROM `PapelVinculo`", ct);
            logger.LogInformation("PapelVinculo total: {Count}", papeis);
            var rows = await QueryAsync(db,
                "SELECT CodigoPapelVinculo, Descricao FROM `PapelVinculo` ORDER BY CodigoPapelVinculo", ct);
            foreach (var row in rows)
                logger.LogInformation("  Papel {Id}: {Desc}", row[0], row[1]);
        }

        if (await TableExistsAsync(db, "Fornecedor", ct))
        {
            var pk = await QueryAsync(db, """
                SELECT COLUMN_NAME, COLUMN_KEY FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Fornecedor'
                ORDER BY ORDINAL_POSITION
                """, ct);
            foreach (var c in pk)
                logger.LogInformation("Fornecedor col {Name} key={Key}", c[0], c[1]);
        }

        return 0;
    }

    public static async Task<int> MigrateAsync(IServiceProvider services, ILogger logger, bool allowDropLegacy, CancellationToken ct)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await LogDatabaseIdentityAsync(db, logger, ct);

        await Exec(db, logger, "SET FOREIGN_KEY_CHECKS = 0", ct);

        await EnsurePapelVinculoAsync(db, logger, ct);
        await EnsurePessoaVinculoAsync(db, logger, ct);
        await EnsureAutorizacaoAcessoTemporarioAsync(db, logger, ct);
        await MigrateLegacyVinculosAsync(db, logger, ct);
        await EnsureFornecedorModelAsync(db, logger, ct);
        await EnsureMaterialEncomendaFksAsync(db, logger, ct);

        if (allowDropLegacy)
            await TryDropLegacyTablesAsync(db, logger, ct);
        else
            logger.LogInformation("DROP legado omitido (use --allow-drop-legacy para remover tabelas vazias).");

        await Exec(db, logger, "SET FOREIGN_KEY_CHECKS = 1", ct);
        await PostValidateAsync(db, logger, ct);
        return 0;
    }

    private static async Task LogDatabaseIdentityAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        var dbName = await ScalarStringAsync(db, "SELECT DATABASE()", ct);
        var host = db.Database.GetDbConnection().DataSource;
        logger.LogInformation("Conexão ativa — host/tunnel: {Host}, database: {Db}", host, dbName);
        if (!string.Equals(dbName, "condominium", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"Database inesperado: '{dbName}'. Esperado 'condominium'.");
    }

    private static async Task EnsurePapelVinculoAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        await Exec(db, logger, """
            CREATE TABLE IF NOT EXISTS `PapelVinculo` (
              `CodigoPapelVinculo` INT UNSIGNED NOT NULL,
              `Descricao` VARCHAR(150) NOT NULL,
              `EscopoPapel` TINYINT UNSIGNED NOT NULL,
              PRIMARY KEY (`CodigoPapelVinculo`),
              UNIQUE KEY `uq_PapelVinculo_Descricao` (`Descricao`),
              KEY `idx_PapelVinculo_EscopoPapel` (`EscopoPapel`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """, ct);

        var seeds = new (int Id, string Desc, int Escopo)[]
        {
            (1, "Proprietário", 2), (2, "Morador", 2), (3, "Locatário", 2), (4, "Dependente", 2),
            (5, "Familiar", 2), (6, "Hóspede", 2), (7, "Corretor", 2), (8, "Visitante", 2),
            (10, "Síndico", 1), (11, "Subsíndico", 1), (12, "Conselheiro", 1), (13, "Administradora", 1),
            (14, "Funcionário", 1), (15, "Prestador", 1), (16, "Terceirizado", 1), (17, "Fornecedor", 1),
            (18, "Entregador", 1),
            (20, "Representante Legal", 3), (21, "Familiar (pessoa)", 3), (22, "Dependente (pessoa)", 3),
            (23, "Prestador (unidade)", 2)
        };
        foreach (var (id, desc, escopo) in seeds)
        {
            await Exec(db, logger,
                $"INSERT IGNORE INTO `PapelVinculo` (`CodigoPapelVinculo`, `Descricao`, `EscopoPapel`) VALUES ({id}, '{desc.Replace("'", "''")}', {escopo})",
                ct);
        }

        logger.LogInformation("PapelVinculo: {Count} papéis", await ScalarLongAsync(db, "SELECT COUNT(*) FROM `PapelVinculo`", ct));
    }

    private static async Task EnsurePessoaVinculoAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        await Exec(db, logger, """
            CREATE TABLE IF NOT EXISTS `PessoaVinculo` (
              `IdVinculo` INT UNSIGNED NOT NULL AUTO_INCREMENT,
              `IdPessoa` INT UNSIGNED NOT NULL,
              `CodigoPapelVinculo` INT UNSIGNED NOT NULL,
              `IdCondominio` INT UNSIGNED NOT NULL,
              `IdUnidade` INT UNSIGNED NULL,
              `IdPessoaRelacionada` INT UNSIGNED NULL,
              `DataInicio` DATE NOT NULL,
              `DataFim` DATE NULL,
              `IdPerfil` INT UNSIGNED NULL,
              `Responsavel` TINYINT(1) NOT NULL,
              `Observacao` VARCHAR(500) NULL,
              PRIMARY KEY (`IdVinculo`),
              KEY `IdxPessoaVinculoAtivo` (`IdPessoa`, `IdCondominio`, `CodigoPapelVinculo`, `DataInicio`, `DataFim`),
              KEY `idx_PessoaVinculo_DataInicio` (`DataInicio`),
              KEY `idx_PessoaVinculo_DataFim` (`DataFim`),
              KEY `idx_PessoaVinculo_Responsavel` (`Responsavel`),
              CONSTRAINT `fk_PessoaVinculo_IdPessoa` FOREIGN KEY (`IdPessoa`) REFERENCES `Pessoa` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT,
              CONSTRAINT `fk_PessoaVinculo_CodigoPapelVinculo` FOREIGN KEY (`CodigoPapelVinculo`) REFERENCES `PapelVinculo` (`CodigoPapelVinculo`) ON UPDATE CASCADE ON DELETE RESTRICT,
              CONSTRAINT `fk_PessoaVinculo_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT,
              CONSTRAINT `fk_PessoaVinculo_IdUnidade` FOREIGN KEY (`IdUnidade`) REFERENCES `Unidade` (`IdUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT,
              CONSTRAINT `fk_PessoaVinculo_IdPessoaRelacionada` FOREIGN KEY (`IdPessoaRelacionada`) REFERENCES `Pessoa` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT,
              CONSTRAINT `fk_PessoaVinculo_IdPerfil` FOREIGN KEY (`IdPerfil`) REFERENCES `PerfilAcesso` (`IdPerfil`) ON UPDATE CASCADE ON DELETE RESTRICT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """, ct);
    }

    private static async Task EnsureAutorizacaoAcessoTemporarioAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        await Exec(db, logger, """
            CREATE TABLE IF NOT EXISTS `AutorizacaoAcessoTemporario` (
              `IdAutorizacao` INT UNSIGNED NOT NULL AUTO_INCREMENT,
              `IdCondominio` INT UNSIGNED NOT NULL,
              `IdUnidade` INT UNSIGNED NULL,
              `IdPessoaVisitante` INT UNSIGNED NULL,
              `NomeVisitante` VARCHAR(255) NULL,
              `DocumentoVisitante` VARCHAR(14) NULL,
              `IdPessoaAutorizador` INT UNSIGNED NOT NULL,
              `DataHoraInicio` DATETIME NOT NULL,
              `DataHoraFim` DATETIME NOT NULL,
              `TipoAcesso` TINYINT UNSIGNED NOT NULL,
              `Motivo` VARCHAR(500) NULL,
              PRIMARY KEY (`IdAutorizacao`),
              KEY `idx_AutorizacaoAcessoTemporario_NomeVisitante` (`NomeVisitante`),
              KEY `idx_AutorizacaoAcessoTemporario_DataHoraInicio` (`DataHoraInicio`),
              KEY `idx_AutorizacaoAcessoTemporario_DataHoraFim` (`DataHoraFim`),
              KEY `idx_AutorizacaoAcessoTemporario_TipoAcesso` (`TipoAcesso`),
              CONSTRAINT `fk_AutorizacaoAcessoTemporario_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT,
              CONSTRAINT `fk_AutorizacaoAcessoTemporario_IdUnidade` FOREIGN KEY (`IdUnidade`) REFERENCES `Unidade` (`IdUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT,
              CONSTRAINT `fk_AutorizacaoAcessoTemporario_IdPessoaVisitante` FOREIGN KEY (`IdPessoaVisitante`) REFERENCES `Pessoa` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT,
              CONSTRAINT `fk_AutorizacaoAcessoTemporario_IdPessoaAutorizador` FOREIGN KEY (`IdPessoaAutorizador`) REFERENCES `Pessoa` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """, ct);
    }

    private static async Task MigrateLegacyVinculosAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        if (!await TableExistsAsync(db, "PessoaCondominio", ct))
        {
            logger.LogInformation("PessoaCondominio ausente — migração legado condomínio ignorada.");
        }
        else
        {
            var hasPerfil = await ColumnExistsAsync(db, "PessoaCondominio", "IdPerfil", ct);
            var perfilExpr = hasPerfil ? "pc.`IdPerfil`" : "NULL";
            var sql = $"""
                INSERT INTO `PessoaVinculo` (`IdPessoa`, `CodigoPapelVinculo`, `IdCondominio`, `DataInicio`, `DataFim`, `IdPerfil`, `Responsavel`)
                SELECT pc.`IdPessoa`,
                  CASE pc.`TipoVinculo`
                    WHEN 1 THEN 14 WHEN 2 THEN 10 WHEN 3 THEN 11 WHEN 4 THEN 12
                    WHEN 5 THEN 14 WHEN 6 THEN 16 WHEN 7 THEN 15 WHEN 8 THEN 15
                    ELSE 14
                  END,
                  pc.`IdCondominio`, pc.`DataInicio`, pc.`DataFim`, {perfilExpr}, 0
                FROM `PessoaCondominio` pc
                WHERE NOT EXISTS (
                  SELECT 1 FROM `PessoaVinculo` pv
                  WHERE pv.`IdPessoa` = pc.`IdPessoa` AND pv.`IdCondominio` = pc.`IdCondominio`
                    AND pv.`DataInicio` = pc.`DataInicio` AND pv.`IdUnidade` IS NULL
                )
                """;
            var n = await ExecRows(db, logger, sql, ct);
            logger.LogInformation("PessoaCondominio -> PessoaVinculo: {Rows} inseridos", n);
        }

        if (!await TableExistsAsync(db, "PessoaUnidade", ct))
        {
            logger.LogInformation("PessoaUnidade ausente — migração legado unidade ignorada.");
            return;
        }

        var respCol = await ColumnExistsAsync(db, "PessoaUnidade", "Responsavel", ct)
            ? "pu.`Responsavel`"
            : await ColumnExistsAsync(db, "PessoaUnidade", "Resposavel", ct)
                ? "IFNULL(pu.`Resposavel`, 0)"
                : "0";

        await ExecRows(db, logger, $"""
            INSERT INTO `PessoaVinculo` (`IdPessoa`, `CodigoPapelVinculo`, `IdCondominio`, `IdUnidade`, `DataInicio`, `DataFim`, `Responsavel`)
            SELECT pu.`IdPessoa`,
              CASE pu.`TipoVinculo`
                WHEN 1 THEN 7 WHEN 2 THEN 1 WHEN 3 THEN 1 WHEN 4 THEN 2 WHEN 5 THEN 2
                ELSE 2
              END,
              u.`IdCondominio`, pu.`IdUnidade`, pu.`DataInicio`, pu.`DataFim`, {respCol}
            FROM `PessoaUnidade` pu
            JOIN `Unidade` u ON u.`IdUnidade` = pu.`IdUnidade`
            WHERE NOT EXISTS (
              SELECT 1 FROM `PessoaVinculo` pv
              WHERE pv.`IdPessoa` = pu.`IdPessoa` AND pv.`IdUnidade` <=> pu.`IdUnidade`
                AND pv.`DataInicio` = pu.`DataInicio`
            )
            """, ct);

        logger.LogInformation("PessoaVinculo após migração: {Count}", await ScalarLongAsync(db, "SELECT COUNT(*) FROM `PessoaVinculo`", ct));
    }

    private static async Task EnsureFornecedorModelAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        if (!await TableExistsAsync(db, "Fornecedor", ct))
            throw new InvalidOperationException("Tabela Fornecedor não encontrada.");

        var idFornecedorIsPk = await QueryAsync(db, """
            SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Fornecedor'
              AND COLUMN_NAME = 'IdFornecedor' AND COLUMN_KEY = 'PRI'
            """, ct);
        if (idFornecedorIsPk.Count > 0 && idFornecedorIsPk[0][0] == "1")
        {
            if (!await ColumnExistsAsync(db, "Fornecedor", "Ativo", ct))
                await Exec(db, logger, "ALTER TABLE `Fornecedor` ADD COLUMN `Ativo` TINYINT(1) NOT NULL DEFAULT 1", ct);
            logger.LogInformation("Fornecedor já possui IdFornecedor como PK.");
            await RemapFornecedorFkValuesAsync(db, logger, ct);
            return;
        }

        logger.LogWarning("Reestruturando Fornecedor (PK IdFornecedor).");
        await DropForeignKeysReferencingAsync(db, logger, "Fornecedor", ct);
        await TryDropFk(db, logger, "Fornecedor", "fk_Fornecedor_IdPessoa", ct);
        await TryDropFk(db, logger, "Fornecedor", "fk_Fornecedor_IdCondominio", ct);

        if (!await ColumnExistsAsync(db, "Fornecedor", "IdFornecedor", ct))
        {
            await Exec(db, logger, "ALTER TABLE `Fornecedor` DROP PRIMARY KEY", ct);
            await Exec(db, logger,
                "ALTER TABLE `Fornecedor` ADD COLUMN `IdFornecedor` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST", ct);
        }
        else if (idFornecedorIsPk.Count == 0 || idFornecedorIsPk[0][0] != "1")
        {
            await Exec(db, logger, "ALTER TABLE `Fornecedor` DROP PRIMARY KEY", ct);
            await Exec(db, logger,
                "ALTER TABLE `Fornecedor` MODIFY COLUMN `IdFornecedor` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY", ct);
        }

        if (!await ColumnExistsAsync(db, "Fornecedor", "Ativo", ct))
            await Exec(db, logger, "ALTER TABLE `Fornecedor` ADD COLUMN `Ativo` TINYINT(1) NOT NULL DEFAULT 1", ct);

        await TryAddFk(db, logger,
            "ALTER TABLE `Fornecedor` ADD CONSTRAINT `fk_Fornecedor_IdPessoa` FOREIGN KEY (`IdPessoa`) REFERENCES `Pessoa` (`IdPessoa`) ON UPDATE CASCADE ON DELETE RESTRICT", ct);
        await TryAddFk(db, logger,
            "ALTER TABLE `Fornecedor` ADD CONSTRAINT `fk_Fornecedor_IdCondominio` FOREIGN KEY (`IdCondominio`) REFERENCES `Condominio` (`IdCondominio`) ON UPDATE CASCADE ON DELETE RESTRICT", ct);

        var uk = await QueryAsync(db, """
            SELECT COUNT(*) FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Fornecedor' AND INDEX_NAME = 'IdxUKFornecedorPessoaCondominio'
            """, ct);
        if (uk.Count > 0 && uk[0][0] == "0")
            await Exec(db, logger,
                "ALTER TABLE `Fornecedor` ADD UNIQUE KEY `IdxUKFornecedorPessoaCondominio` (`IdPessoa`, `IdCondominio`)", ct);

        await RemapFornecedorFkValuesAsync(db, logger, ct);
        await TryAddFk(db, logger,
            "ALTER TABLE `Despesa` ADD CONSTRAINT `fk_Despesa_IdFornecedor` FOREIGN KEY (`IdFornecedor`) REFERENCES `Fornecedor` (`IdFornecedor`) ON UPDATE CASCADE ON DELETE RESTRICT", ct);
        await TryAddFk(db, logger,
            "ALTER TABLE `OfertaConcorrencia` ADD CONSTRAINT `fk_OfertaConcorrencia_IdFornecedor` FOREIGN KEY (`IdFornecedor`) REFERENCES `Fornecedor` (`IdFornecedor`) ON UPDATE CASCADE ON DELETE RESTRICT", ct);
    }

    private static async Task RemapFornecedorFkValuesAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        if (!await TableExistsAsync(db, "Despesa", ct)) return;

        var n = await ExecRows(db, logger, """
            UPDATE `Despesa` d
            JOIN `Fornecedor` f ON f.`IdPessoa` = d.`IdFornecedor` AND f.`IdCondominio` = d.`IdCondominio`
            SET d.`IdFornecedor` = f.`IdFornecedor`
            WHERE d.`IdFornecedor` <> f.`IdFornecedor`
            """, ct);
        if (n > 0) logger.LogInformation("Despesa.IdFornecedor remapeado: {Rows}", n);

        if (!await TableExistsAsync(db, "OfertaConcorrencia", ct)) return;
        if (!await ColumnExistsAsync(db, "OfertaConcorrencia", "IdCondominio", ct))
        {
            n = await ExecRows(db, logger, """
                UPDATE `OfertaConcorrencia` o
                JOIN `Fornecedor` f ON f.`IdPessoa` = o.`IdFornecedor`
                SET o.`IdFornecedor` = f.`IdFornecedor`
                WHERE o.`IdFornecedor` <> f.`IdFornecedor`
                """, ct);
        }
        else
        {
            n = await ExecRows(db, logger, """
                UPDATE `OfertaConcorrencia` o
                JOIN `Fornecedor` f ON f.`IdPessoa` = o.`IdFornecedor` AND f.`IdCondominio` = o.`IdCondominio`
                SET o.`IdFornecedor` = f.`IdFornecedor`
                WHERE o.`IdFornecedor` <> f.`IdFornecedor`
                """, ct);
        }

        if (n > 0) logger.LogInformation("OfertaConcorrencia.IdFornecedor remapeado: {Rows}", n);
    }

    private static async Task EnsureMaterialEncomendaFksAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        if (await TableExistsAsync(db, "GuardaEncomenda", ct)
            && await ColumnExistsAsync(db, "GuardaEncomenda", "IdVinculoRetirada", ct))
        {
            await TryAddFk(db, logger,
                "ALTER TABLE `GuardaEncomenda` ADD CONSTRAINT `fk_GuardaEncomenda_IdVinculoRetirada` FOREIGN KEY (`IdVinculoRetirada`) REFERENCES `PessoaVinculo` (`IdVinculo`) ON UPDATE CASCADE ON DELETE RESTRICT",
                ct);
        }

        if (await TableExistsAsync(db, "AlocacaoMaterial", ct) && await ColumnExistsAsync(db, "AlocacaoMaterial", "IdVinculo", ct))
        {
            await TryAddFk(db, logger,
                "ALTER TABLE `AlocacaoMaterial` ADD CONSTRAINT `fk_AlocacaoMaterial_IdVinculo` FOREIGN KEY (`IdVinculo`) REFERENCES `PessoaVinculo` (`IdVinculo`) ON UPDATE CASCADE ON DELETE RESTRICT",
                ct);
        }

        if (await TableExistsAsync(db, "EntradaSaidaMaterialConsumo", ct)
            && await ColumnExistsAsync(db, "EntradaSaidaMaterialConsumo", "IdVinculo", ct))
        {
            await TryAddFk(db, logger,
                "ALTER TABLE `EntradaSaidaMaterialConsumo` ADD CONSTRAINT `fk_EntradaSaidaMaterialConsumo_IdVinculo` FOREIGN KEY (`IdVinculo`) REFERENCES `PessoaVinculo` (`IdVinculo`) ON UPDATE CASCADE ON DELETE RESTRICT",
                ct);
        }
    }

    private static async Task TryDropLegacyTablesAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        foreach (var t in new[] { "PessoaUnidade", "PessoaCondominio" })
        {
            if (!await TableExistsAsync(db, t, ct)) continue;
            var cnt = await ScalarLongAsync(db, $"SELECT COUNT(*) FROM `{t}`", ct);
            if (cnt > 0)
            {
                logger.LogWarning("{Table} ainda contém {Count} registros — DROP não executado.", t, cnt);
                continue;
            }

            var refs = await ScalarLongAsync(db, $"""
                SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME = '{t}'
                """, ct);
            if (refs > 0)
            {
                logger.LogWarning("{Table} ainda referenciada por FK — DROP não executado.", t);
                continue;
            }

            await Exec(db, logger, $"DROP TABLE `{t}`", ct);
            logger.LogInformation("Tabela legada {Table} removida.", t);
        }
    }

    private static async Task PostValidateAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        logger.LogInformation("--- Validação pós-migração ---");
        logger.LogInformation("PapelVinculo: {C}", await ScalarLongAsync(db, "SELECT COUNT(*) FROM `PapelVinculo`", ct));
        logger.LogInformation("PessoaVinculo: {C}", await ScalarLongAsync(db, "SELECT COUNT(*) FROM `PessoaVinculo`", ct));
        var fornecedor = await ScalarLongAsync(db, "SELECT COUNT(*) FROM `Fornecedor`", ct);
        logger.LogInformation("Fornecedor: {C}", fornecedor);
        if (await TableExistsAsync(db, "AutorizacaoAcessoTemporario", ct))
            logger.LogInformation("AutorizacaoAcessoTemporario: {C}", await ScalarLongAsync(db, "SELECT COUNT(*) FROM `AutorizacaoAcessoTemporario`", ct));
    }

    private static async Task<bool> TableExistsAsync(AppDbContext db, string table, CancellationToken ct)
    {
        var n = await ScalarLongAsync(db, """
            SELECT COUNT(*) FROM information_schema.tables
            WHERE table_schema = DATABASE() AND table_name = @p0
            """, ct, table);
        return n > 0;
    }

    private static async Task<bool> ColumnExistsAsync(AppDbContext db, string table, string column, CancellationToken ct)
    {
        var n = await ScalarLongAsync(db, """
            SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @p0 AND COLUMN_NAME = @p1
            """, ct, table, column);
        return n > 0;
    }

    private static async Task Exec(AppDbContext db, ILogger logger, string sql, CancellationToken ct)
    {
        logger.LogDebug("SQL: {Sql}", sql.Length > 120 ? sql[..120] + "..." : sql);
        await db.Database.ExecuteSqlRawAsync(sql, ct);
    }

    private static async Task<int> ExecRows(AppDbContext db, ILogger logger, string sql, CancellationToken ct)
    {
        logger.LogInformation("Executando DML ({Len} chars)...", sql.Length);
        return await db.Database.ExecuteSqlRawAsync(sql, ct);
    }

    private static async Task DropForeignKeysReferencingAsync(AppDbContext db, ILogger logger, string referencedTable, CancellationToken ct)
    {
        var fks = await QueryAsync(db, $"""
            SELECT TABLE_NAME, CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME = '{referencedTable}'
            """, ct);
        foreach (var row in fks)
            await TryDropFk(db, logger, row[0], row[1], ct);
    }

    private static async Task TryDropFk(AppDbContext db, ILogger logger, string table, string fk, CancellationToken ct)
    {
        try
        {
            await Exec(db, logger, $"ALTER TABLE `{table}` DROP FOREIGN KEY `{fk}`", ct);
        }
        catch (Exception ex) when (ex.Message.Contains("check that it exists", StringComparison.OrdinalIgnoreCase)
                                     || ex.Message.Contains("Can't DROP", StringComparison.OrdinalIgnoreCase))
        {
            logger.LogWarning("FK {Fk} ausente em {Table}", fk, table);
        }
    }

    private static async Task TryAddFk(AppDbContext db, ILogger logger, string sql, CancellationToken ct)
    {
        try
        {
            await Exec(db, logger, sql, ct);
        }
        catch (Exception ex) when (ex.Message.Contains("Duplicate", StringComparison.OrdinalIgnoreCase)
                                     || ex.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase))
        {
            logger.LogWarning("FK já existente: {Msg}", ex.Message);
        }
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