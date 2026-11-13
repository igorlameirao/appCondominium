using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace AppCondominium.Tools;

/// <summary>Aplica correções incrementais na tabela Unidade (Id AUTO_INCREMENT, IdHidrometro opcional).</summary>
public static class UnidadeSchemaFix
{
    private static readonly (string Tabela, string Constraint)[] ForeignKeysReferencingUnidade =
    [
        ("Hidrometro", "fk_Hidrometro_IdUnidade"),
        ("ConsumoAgua", "fk_ConsumoAgua_IdUnidade"),
        ("AluguelEquipamento", "fk_AluguelEquipamento_IdUnidade"),
        ("PessoaUnidade", "fk_PessoaUnidade_IdUnidade"),
        ("Cobranca", "fk_Cobranca_IdUnidade"),
        ("GuardaEncomenda", "fk_GuardaEncomenda_IdUnidade"),
    ];

    private static readonly string[] RecreateForeignKeys =
    [
        "ALTER TABLE `Hidrometro` ADD CONSTRAINT `fk_Hidrometro_IdUnidade` FOREIGN KEY (`IdUnidade`) REFERENCES `Unidade` (`IdUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT",
        "ALTER TABLE `ConsumoAgua` ADD CONSTRAINT `fk_ConsumoAgua_IdUnidade` FOREIGN KEY (`IdUnidade`) REFERENCES `Unidade` (`IdUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT",
        "ALTER TABLE `AluguelEquipamento` ADD CONSTRAINT `fk_AluguelEquipamento_IdUnidade` FOREIGN KEY (`IdUnidade`) REFERENCES `Unidade` (`IdUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT",
        "ALTER TABLE `PessoaUnidade` ADD CONSTRAINT `fk_PessoaUnidade_IdUnidade` FOREIGN KEY (`IdUnidade`) REFERENCES `Unidade` (`IdUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT",
        "ALTER TABLE `Cobranca` ADD CONSTRAINT `fk_Cobranca_IdUnidade` FOREIGN KEY (`IdUnidade`) REFERENCES `Unidade` (`IdUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT",
        "ALTER TABLE `GuardaEncomenda` ADD CONSTRAINT `fk_GuardaEncomenda_IdUnidade` FOREIGN KEY (`IdUnidade`) REFERENCES `Unidade` (`IdUnidade`) ON UPDATE CASCADE ON DELETE RESTRICT",
    ];

    public static async Task<int> RunAsync(IServiceProvider services, ILogger logger, CancellationToken ct)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE `Unidade` MODIFY COLUMN `IdHidrometro` INT UNSIGNED NULL", ct);
        logger.LogInformation("IdHidrometro ajustado para NULL.");

        foreach (var (tabela, constraint) in ForeignKeysReferencingUnidade)
        {
            var sql = $"ALTER TABLE `{tabela}` DROP FOREIGN KEY `{constraint}`";
            logger.LogInformation("Executando: {Sql}", sql);
            try
            {
                await db.Database.ExecuteSqlRawAsync(sql, ct);
            }
            catch (Exception ex) when (ex.Message.Contains("check that it exists", StringComparison.OrdinalIgnoreCase)
                                       || ex.Message.Contains("Can't DROP", StringComparison.OrdinalIgnoreCase))
            {
                logger.LogWarning("FK {Constraint} em {Tabela} já ausente: {Message}", constraint, tabela, ex.Message);
            }
        }

        const string alterPk = "ALTER TABLE `Unidade` MODIFY COLUMN `IdUnidade` INT UNSIGNED NOT NULL AUTO_INCREMENT";
        logger.LogInformation("Executando: {Sql}", alterPk);
        await db.Database.ExecuteSqlRawAsync(alterPk, ct);

        foreach (var sql in RecreateForeignKeys)
        {
            logger.LogInformation("Executando: {Sql}", sql);
            try
            {
                await db.Database.ExecuteSqlRawAsync(sql, ct);
            }
            catch (Exception ex) when (ex.Message.Contains("Duplicate foreign key", StringComparison.OrdinalIgnoreCase)
                                       || ex.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase))
            {
                logger.LogWarning("FK já existente: {Message}", ex.Message);
            }
        }

        logger.LogInformation("Schema da tabela Unidade atualizado.");
        return 0;
    }
}
