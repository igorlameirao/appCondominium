using AppCondominium.Infrastructure;
using AppCondominium.Tools;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

var fixUnidadeSchema = args.Any(a => string.Equals(a, "fix-unidade-schema", StringComparison.OrdinalIgnoreCase));
var inspectPessoaVinculo = args.Any(a => string.Equals(a, "inspect-pessoa-vinculo", StringComparison.OrdinalIgnoreCase));
var migratePessoaVinculo = args.Any(a => string.Equals(a, "migrate-pessoa-vinculo", StringComparison.OrdinalIgnoreCase));
var migrateConviteAcesso = args.Any(a => string.Equals(a, "migrate-convite-acesso", StringComparison.OrdinalIgnoreCase));
var migrateEmailModule = args.Any(a => string.Equals(a, "migrate-email-module", StringComparison.OrdinalIgnoreCase));
var migrateRecuperacaoSenha = args.Any(a => string.Equals(a, "migrate-recuperacao-senha", StringComparison.OrdinalIgnoreCase));
var migrateMaterialTables = args.Any(a => string.Equals(a, "migrate-material-tables", StringComparison.OrdinalIgnoreCase));
var inspectMaterialTables = args.Any(a => string.Equals(a, "inspect-material-tables", StringComparison.OrdinalIgnoreCase));
var transferSmtpFromSco = args.Any(a => string.Equals(a, "transfer-smtp-from-sco", StringComparison.OrdinalIgnoreCase));
var diagnoseSmtp = args.Any(a => string.Equals(a, "diagnose-smtp", StringComparison.OrdinalIgnoreCase));
var diagnoseLogin = args.Any(a => string.Equals(a, "diagnose-login", StringComparison.OrdinalIgnoreCase));
var allowDropLegacy = args.Any(a => string.Equals(a, "--allow-drop-legacy", StringComparison.OrdinalIgnoreCase));
var dropColumns = args.Any(a => string.Equals(a, "--drop-columns", StringComparison.OrdinalIgnoreCase));
var apiDir = EncontrarApi();

var builder = Host.CreateApplicationBuilder(new HostApplicationBuilderSettings
{
    Args = args,
    ContentRootPath = apiDir
});
builder.Configuration
    .AddJsonFile(Path.Combine(apiDir, "appsettings.json"), optional: false)
    .AddJsonFile(Path.Combine(apiDir, "appsettings.Development.json"), optional: true)
    .AddJsonFile(CaminhoUserSecrets(), optional: true)
    .AddEnvironmentVariables();

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddTransient<BlobToS3Migrator>();

using var host = builder.Build();
var logger = host.Services.GetRequiredService<ILoggerFactory>().CreateLogger("AppCondominium.Tools");
try
{
    if (fixUnidadeSchema)
        return await UnidadeSchemaFix.RunAsync(host.Services, logger, CancellationToken.None);

    if (inspectPessoaVinculo)
        return await PessoaVinculoAwsMigration.InspectAsync(host.Services, logger, CancellationToken.None);

    if (migratePessoaVinculo)
        return await PessoaVinculoAwsMigration.MigrateAsync(host.Services, logger, allowDropLegacy, CancellationToken.None);

    if (migrateConviteAcesso)
        return await ConviteAcessoAwsMigration.EnsureAsync(host.Services, logger, CancellationToken.None);

    if (migrateEmailModule)
        return await EmailModuleAwsMigration.EnsureAsync(host.Services, logger, CancellationToken.None);

    if (migrateRecuperacaoSenha)
        return await RecuperacaoSenhaAwsMigration.EnsureAsync(host.Services, logger, CancellationToken.None);

    if (inspectMaterialTables)
        return await MaterialTablesMigration.InspectAsync(host.Services, logger, CancellationToken.None);

    if (migrateMaterialTables)
        return await MaterialTablesMigration.EnsureAsync(host.Services, logger, CancellationToken.None);

    if (transferSmtpFromSco)
        return await TransferirSmtpDoScoAsync(host.Services, logger, CancellationToken.None);

    if (diagnoseSmtp)
        return await SmtpPasswordDiagnose.RunAsync(host.Services, CancellationToken.None);

    if (diagnoseLogin)
        return await LoginDiagnose.RunAsync(host.Services, CancellationToken.None);

    using var scope = host.Services.CreateScope();
    var migrator = scope.ServiceProvider.GetRequiredService<BlobToS3Migrator>();
    await migrator.RunAsync(dropColumns, CancellationToken.None);
}
catch (Exception ex)
{
  var ctx = fixUnidadeSchema ? "Correção de schema Unidade"
    : inspectPessoaVinculo ? "Inspeção PessoaVinculo"
    : migratePessoaVinculo ? "Migração PessoaVinculo/RDS"
    : migrateConviteAcesso ? "Migração ConviteAcesso/RDS"
    : migrateEmailModule ? "Migração módulo e-mail/RDS"
    : migrateRecuperacaoSenha ? "Migração RecuperacaoSenha/RDS"
    : inspectMaterialTables ? "Inspeção tabelas material"
    : migrateMaterialTables ? "Migração tabelas AlocacaoMaterial / EntradaSaidaMaterialConsumo"
    : transferSmtpFromSco ? "Transferência SMTP SCO→AppCondominium"
    : "Migração de BLOBs para o S3";
  logger.LogError(ex, "{Ctx} interrompida.", ctx);
  return 1;
}

return 0;

static Task<int> TransferirSmtpDoScoAsync(IServiceProvider services, ILogger logger, CancellationToken ct)
{
#if HAS_SCO_REFERENCE
    return SmtpConfigScoTransfer.RunAsync(services, logger, ct);
#else
    logger.LogError(
        "O comando transfer-smtp-from-sco precisa do projeto SCO em C:\\Projetos\\M7\\SCO\\src\\ControleOcorrencias.Infrastructure.");
    return Task.FromResult(1);
#endif
}

static string CaminhoUserSecrets() =>
    Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "Microsoft", "UserSecrets", "app-condominium-api-2026", "secrets.json");

static string EncontrarApi()
{
    var dir = new DirectoryInfo(AppContext.BaseDirectory);
    while (dir != null)
    {
        var candidato = Path.Combine(dir.FullName, "AppCondominium.API");
        if (File.Exists(Path.Combine(candidato, "appsettings.json")))
            return candidato;
        var aninhado = Path.Combine(dir.FullName, "WebApi", "AppCondominium.API");
        if (File.Exists(Path.Combine(aninhado, "appsettings.json")))
            return aninhado;
        dir = dir.Parent;
    }
    throw new InvalidOperationException("Não encontrei WebApi/AppCondominium.API/appsettings.json.");
}
