using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace AppCondominium.Tools;

/// <summary>Cria tabelas de e-mail (configuracaoemail, emailqueue) e coluna IdEmailQueue em ConviteAcesso.</summary>
public static class EmailModuleAwsMigration
{
    public static async Task<int> EnsureAsync(IServiceProvider services, ILogger logger, CancellationToken ct)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        const string cfgSql = """
            CREATE TABLE IF NOT EXISTS `configuracaoemail` (
              `Id` int NOT NULL AUTO_INCREMENT,
              `Provedor` varchar(40) NOT NULL,
              `ServidorSmtp` varchar(255) NOT NULL,
              `Porta` int NOT NULL,
              `Ssl` tinyint(1) NOT NULL,
              `StartTls` tinyint(1) NOT NULL,
              `TimeoutSegundos` int NOT NULL,
              `UsuarioSmtp` varchar(255) NOT NULL,
              `SenhaCriptografada` varchar(2000) NOT NULL,
              `NomeRemetente` varchar(200) NOT NULL,
              `EmailRemetente` varchar(255) NOT NULL,
              `ReplyTo` varchar(255) DEFAULT NULL,
              `DataCadastro` datetime(6) NOT NULL,
              `DataAtualizacao` datetime(6) DEFAULT NULL,
              `Ativo` tinyint(1) NOT NULL,
              PRIMARY KEY (`Id`),
              KEY `IX_configuracaoemail_Ativo` (`Ativo`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """;

        const string queueSql = """
            CREATE TABLE IF NOT EXISTS `emailqueue` (
              `Id` bigint NOT NULL AUTO_INCREMENT,
              `Destinatario` varchar(255) NOT NULL,
              `Assunto` varchar(500) NOT NULL,
              `Corpo` longtext NOT NULL,
              `CorpoHtml` tinyint(1) NOT NULL,
              `Status` varchar(20) NOT NULL,
              `Tentativas` int NOT NULL,
              `UltimaTentativa` datetime(6) DEFAULT NULL,
              `MensagemErro` varchar(2000) DEFAULT NULL,
              `DataCriacao` datetime(6) NOT NULL,
              `DataEnvio` datetime(6) DEFAULT NULL,
              PRIMARY KEY (`Id`),
              KEY `IX_emailqueue_Status_DataCriacao` (`Status`,`DataCriacao`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """;

        await db.Database.ExecuteSqlRawAsync(cfgSql, ct);
        await db.Database.ExecuteSqlRawAsync(queueSql, ct);
        logger.LogInformation("Tabelas configuracaoemail e emailqueue verificadas.");

        try
        {
            await db.Database.ExecuteSqlRawAsync(
                "ALTER TABLE `ConviteAcesso` ADD COLUMN `IdEmailQueue` bigint DEFAULT NULL", ct);
            logger.LogInformation("Coluna ConviteAcesso.IdEmailQueue adicionada.");
        }
        catch (Exception ex) when (ex.Message.Contains("Duplicate column", StringComparison.OrdinalIgnoreCase))
        {
            logger.LogInformation("Coluna ConviteAcesso.IdEmailQueue já existe.");
        }

        return 0;
    }
}