using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace AppCondominium.Tools;

/// <summary>
/// Cria a tabela RecuperacaoSenhaToken no RDS (database condominium) de forma não destrutiva.
/// </summary>
public static class RecuperacaoSenhaAwsMigration
{
    public static async Task<int> EnsureAsync(IServiceProvider services, ILogger logger, CancellationToken ct)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        const string sql = """
            CREATE TABLE IF NOT EXISTS `RecuperacaoSenhaToken` (
              `IdRecuperacaoSenha` int unsigned NOT NULL AUTO_INCREMENT,
              `IdPessoa` int unsigned NOT NULL,
              `TokenHash` varchar(64) NOT NULL,
              `EmailNormalizado` varchar(255) NOT NULL,
              `DataCriacao` datetime(6) NOT NULL,
              `DataExpiracao` datetime(6) NOT NULL,
              `Estado` tinyint unsigned NOT NULL DEFAULT 0,
              `DataConsumo` datetime(6) DEFAULT NULL,
              `IdEmailQueue` bigint DEFAULT NULL,
              PRIMARY KEY (`IdRecuperacaoSenha`),
              UNIQUE KEY `uq_RecuperacaoSenhaToken_TokenHash` (`TokenHash`),
              KEY `idx_RecuperacaoSenha_IdPessoa_Estado` (`IdPessoa`,`Estado`),
              CONSTRAINT `fk_RecuperacaoSenha_IdPessoa` FOREIGN KEY (`IdPessoa`) REFERENCES `Pessoa` (`IdPessoa`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """;

        await db.Database.ExecuteSqlRawAsync(sql, ct);
        logger.LogInformation("Tabela RecuperacaoSenhaToken verificada/criada.");
        return 0;
    }
}