using AppCondominium.Application.DTOs;
using AppCondominium.Application.Interfaces;
using AppCondominium.Infrastructure.Persistence;
using ControleOcorrencias.Infrastructure.Services;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MySqlConnector;
using ScoSmtpProtector = ControleOcorrencias.Infrastructure.Services.SmtpSecretProtector;

namespace AppCondominium.Tools;

/// <summary>Transfere configuração SMTP ativa do SCO para o AppCondominium (senha re-criptografada).</summary>
internal static class SmtpConfigScoTransfer
{
    private const string ScoUserSecretsId = "sco-controle-ocorrencias-api-2026";

    public static async Task<int> RunAsync(IServiceProvider condoServices, ILogger logger, CancellationToken ct)
    {
        var report = new TransferReport();

        SshMySqlTunnel? scoTunnel = null;
        try
        {
            var condoConfig = condoServices.GetRequiredService<IConfiguration>();
            var scoConfig = CarregarConfiguracaoSco();
            var scoCsRaw = scoConfig.GetConnectionString("DefaultConnection");
            if (string.IsNullOrWhiteSpace(scoCsRaw))
            {
                report.Erros.Add("Conexão SCO: DefaultConnection não configurada nos User Secrets.");
                ImprimirRelatorio(report);
                return 1;
            }

            (var scoCs, scoTunnel) = await ResolverConexaoScoAsync(scoCsRaw, scoConfig, condoConfig, ct);

            report.AcessoBancoSco = await TestarConexaoAsync(scoCs, ct);
            if (!report.AcessoBancoSco)
            {
                report.Erros.Add("SCO: não foi possível abrir conexão MySQL (verifique rede/bastion).");
                ImprimirRelatorio(report);
                return 1;
            }

            var origem = await LerConfiguracaoAtivaScoAsync(scoCs, ct);
            if (origem == null)
            {
                report.Erros.Add("SCO: nenhuma configuração SMTP ativa encontrada em configuracaoemail.");
                ImprimirRelatorio(report);
                return 1;
            }

            var scoDpServices = new ServiceCollection();
            scoDpServices.AddDataProtection();
            var dp = scoDpServices.BuildServiceProvider();
            var scoProtector = new ScoSmtpProtector(dp.GetRequiredService<IDataProtectionProvider>(), scoConfig);
            string senhaPlain;
            try
            {
                senhaPlain = scoProtector.Unprotect(origem.SenhaCriptografada);
                report.DescriptografiaScoOk = !string.IsNullOrEmpty(senhaPlain);
                if (!report.DescriptografiaScoOk)
                    report.Erros.Add("SCO: senha descriptografada vazia.");
            }
            catch (Exception ex)
            {
                report.Erros.Add($"SCO: falha ao descriptografar senha ({ex.GetType().Name}).");
                ImprimirRelatorio(report);
                return 1;
            }

            using var scope = condoServices.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var condoCs = db.Database.GetConnectionString();
            if (string.IsNullOrWhiteSpace(condoCs))
            {
                report.Erros.Add("AppCondominium: connection string indisponível.");
                ImprimirRelatorio(report);
                return 1;
            }

            report.AcessoBancoCondominium = await TestarConexaoAsync(condoCs, ct);

            var destinoExiste = await db.ConfiguracoesEmail.AnyAsync(ct);
            if (destinoExiste)
            {
                report.Erros.Add("AppCondominium: configuracaoemail já possui registro(s). Transferência interrompida.");
                ImprimirRelatorio(report);
                return 2;
            }

            if (!report.DescriptografiaScoOk)
            {
                ImprimirRelatorio(report);
                return 1;
            }

            var emailService = scope.ServiceProvider.GetRequiredService<IConfiguracaoEmailService>();
            var upsert = new ConfiguracaoEmailUpsertDto
            {
                Provedor = origem.Provedor,
                ServidorSmtp = origem.ServidorSmtp,
                Porta = origem.Porta,
                Ssl = origem.Ssl,
                StartTls = origem.StartTls,
                TimeoutSegundos = origem.TimeoutSegundos,
                UsuarioSmtp = origem.UsuarioSmtp,
                Senha = senhaPlain,
                NomeRemetente = origem.NomeRemetente,
                EmailRemetente = origem.EmailRemetente,
                ReplyTo = origem.ReplyTo,
                Ativo = origem.Ativo
            };

            await emailService.SalvarAsync(upsert, ct);
            report.ConfigTransferida = true;
            report.Host = origem.ServidorSmtp;
            report.Porta = origem.Porta;
            report.Seguranca = FormatarSeguranca(origem.Ssl, origem.StartTls);

            var (_, senhaDestino) = await emailService.ObterAtivaComSenhaAsync(ct);
            report.DescriptografiaCondominiumOk = !string.IsNullOrEmpty(senhaDestino);

            if (!report.DescriptografiaCondominiumOk)
                report.Erros.Add("AppCondominium: senha salva não pôde ser descriptografada.");

            logger.LogInformation("Transferência SMTP SCO→AppCondominium concluída (host={Host}, porta={Porta}).", report.Host, report.Porta);
        }
        catch (Exception ex)
        {
            report.Erros.Add($"Erro inesperado: {ex.GetType().Name} — {TruncarMensagem(ex.Message)}");
            logger.LogError(ex, "Transferência SMTP SCO→AppCondominium falhou.");
            return 1;
        }
        finally
        {
            scoTunnel?.Dispose();
            ImprimirRelatorio(report);
        }

        return report.Sucesso ? 0 : 1;
    }

    private static void ImprimirRelatorio(TransferReport r)
    {
        Console.WriteLine($"Acesso banco SCO: {(r.AcessoBancoSco ? "sim" : "não")}");
        Console.WriteLine($"Acesso banco condominium: {(r.AcessoBancoCondominium ? "sim" : "não")}");
        Console.WriteLine($"Descriptografia SCO: {(r.DescriptografiaScoOk ? "sim" : "não")}");
        Console.WriteLine($"Configuração transferida: {(r.ConfigTransferida ? "sim" : "não")}");
        if (!string.IsNullOrEmpty(r.Host))
        {
            Console.WriteLine($"Host: {r.Host}");
            Console.WriteLine($"Porta: {r.Porta}");
            Console.WriteLine($"Segurança: {r.Seguranca}");
        }
        if (r.ConfigTransferida)
            Console.WriteLine($"Descriptografia AppCondominium: {(r.DescriptografiaCondominiumOk ? "sim" : "não")}");
        foreach (var e in r.Erros)
            Console.WriteLine($"Erro: {e}");
    }

    private static string FormatarSeguranca(bool ssl, bool startTls) =>
        $"Ssl={(ssl ? "sim" : "não")}, StartTls={(startTls ? "sim" : "não")}";

    private static async Task<(string connectionString, SshMySqlTunnel? tunnel)> ResolverConexaoScoAsync(
        string scoRaw,
        IConfiguration scoConfig,
        IConfiguration condoConfig,
        CancellationToken ct)
    {
        var sshSource = !string.IsNullOrWhiteSpace(scoConfig["Database:Ssh:Host"])
            ? scoConfig
            : condoConfig;
        var scoCsb = new MySqlConnectionStringBuilder(scoRaw);
        var viaScoEndpoint = new MySqlConnectionStringBuilder(scoRaw);
        var tunnelSco = SshMySqlTunnel.StartIfConfigured(sshSource, scoCsb.Server, (uint)scoCsb.Port);
        if (tunnelSco != null)
        {
            viaScoEndpoint.Server = "127.0.0.1";
            viaScoEndpoint.Port = tunnelSco.LocalPort;
            if (await TestarConexaoAsync(viaScoEndpoint.ConnectionString, ct))
                return (viaScoEndpoint.ConnectionString, tunnelSco);
            tunnelSco.Dispose();
        }

        var condoRaw = condoConfig.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("AppCondominium: DefaultConnection não configurada.");
        var condoCsb = new MySqlConnectionStringBuilder(condoRaw);
        var compartilhado = new MySqlConnectionStringBuilder(condoRaw)
        {
            Database = scoCsb.Database
        };
        var tunnelCondo = SshMySqlTunnel.StartIfConfigured(condoConfig, condoCsb.Server, (uint)condoCsb.Port);
        if (tunnelCondo != null)
        {
            compartilhado.Server = "127.0.0.1";
            compartilhado.Port = tunnelCondo.LocalPort;
        }

        return (compartilhado.ConnectionString, tunnelCondo);
    }

    private static async Task<bool> TestarConexaoAsync(string connectionString, CancellationToken ct)
    {
        try
        {
            await using var conn = new MySqlConnection(connectionString);
            await conn.OpenAsync(ct);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private static IConfiguration CarregarConfiguracaoSco()
    {
        var apiDir = EncontrarScoApi();
        var secretsPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "Microsoft", "UserSecrets", ScoUserSecretsId, "secrets.json");

        return new ConfigurationBuilder()
            .SetBasePath(apiDir)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddJsonFile(secretsPath, optional: true)
            .AddEnvironmentVariables()
            .Build();
    }

    private static string EncontrarScoApi()
    {
        var candidatos = new[]
        {
            Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "SCO", "src", "ControleOcorrencias.API")),
            Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "..", "SCO", "src", "ControleOcorrencias.API")),
            @"c:\Users\danil\source\repos\SCO\src\ControleOcorrencias.API"
        };
        foreach (var dir in candidatos)
        {
            if (File.Exists(Path.Combine(dir, "appsettings.json")))
                return dir;
        }
        throw new InvalidOperationException("Não encontrei ControleOcorrencias.API/appsettings.json.");
    }

    private static async Task<ScoConfigRow?> LerConfiguracaoAtivaScoAsync(string connectionString, CancellationToken ct)
    {
        const string sql = """
            SELECT Provedor, ServidorSmtp, Porta, `Ssl`, `StartTls`, TimeoutSegundos, UsuarioSmtp,
                   SenhaCriptografada, NomeRemetente, EmailRemetente, ReplyTo, Ativo
            FROM configuracaoemail
            WHERE Ativo = 1
            ORDER BY Id
            LIMIT 1
            """;

        const string sqlFallback = """
            SELECT Provedor, ServidorSmtp, Porta, `Ssl`, `StartTls`, TimeoutSegundos, UsuarioSmtp,
                   SenhaCriptografada, NomeRemetente, EmailRemetente, ReplyTo, Ativo
            FROM configuracaoemail
            ORDER BY Id
            LIMIT 1
            """;

        await using var conn = new MySqlConnection(connectionString);
        await conn.OpenAsync(ct);

        var row = await LerUmaLinhaAsync(conn, sql, ct);
        if (row != null) return row;
        return await LerUmaLinhaAsync(conn, sqlFallback, ct);
    }

    private static async Task<ScoConfigRow?> LerUmaLinhaAsync(MySqlConnection conn, string sql, CancellationToken ct)
    {
        await using var cmd = new MySqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        if (!await reader.ReadAsync(ct)) return null;

        return new ScoConfigRow
        {
            Provedor = reader.GetString(0),
            ServidorSmtp = reader.GetString(1),
            Porta = reader.GetInt32(2),
            Ssl = reader.GetBoolean(3),
            StartTls = reader.GetBoolean(4),
            TimeoutSegundos = reader.GetInt32(5),
            UsuarioSmtp = reader.GetString(6),
            SenhaCriptografada = reader.GetString(7),
            NomeRemetente = reader.GetString(8),
            EmailRemetente = reader.GetString(9),
            ReplyTo = await reader.IsDBNullAsync(10, ct) ? null : reader.GetString(10),
            Ativo = reader.GetBoolean(11)
        };
    }

    private static string TruncarMensagem(string? msg)
    {
        if (string.IsNullOrEmpty(msg)) return string.Empty;
        if (msg.Contains("password", StringComparison.OrdinalIgnoreCase)
            || msg.Contains("Pwd=", StringComparison.OrdinalIgnoreCase)
            || msg.Contains("User ID", StringComparison.OrdinalIgnoreCase))
            return "(mensagem omitida — possível dado sensível)";
        return msg.Length > 200 ? msg[..200] + "…" : msg;
    }

    private sealed class ScoConfigRow
    {
        public string Provedor { get; init; } = "SmtpGenerico";
        public string ServidorSmtp { get; init; } = "";
        public int Porta { get; init; }
        public bool Ssl { get; init; }
        public bool StartTls { get; init; }
        public int TimeoutSegundos { get; init; }
        public string UsuarioSmtp { get; init; } = "";
        public string SenhaCriptografada { get; init; } = "";
        public string NomeRemetente { get; init; } = "";
        public string EmailRemetente { get; init; } = "";
        public string? ReplyTo { get; init; }
        public bool Ativo { get; init; }
    }

    private sealed class TransferReport
    {
        public bool AcessoBancoSco { get; set; }
        public bool AcessoBancoCondominium { get; set; }
        public bool DescriptografiaScoOk { get; set; }
        public bool ConfigTransferida { get; set; }
        public bool DescriptografiaCondominiumOk { get; set; }
        public string? Host { get; set; }
        public int Porta { get; set; }
        public string? Seguranca { get; set; }
        public List<string> Erros { get; } = [];
        public bool Sucesso => ConfigTransferida && DescriptografiaCondominiumOk && Erros.Count == 0;
    }
}