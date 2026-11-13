using AppCondominium.Infrastructure;
using AppCondominium.Tools;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

var fixUnidadeSchema = args.Any(a => string.Equals(a, "fix-unidade-schema", StringComparison.OrdinalIgnoreCase));
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

    using var scope = host.Services.CreateScope();
    var migrator = scope.ServiceProvider.GetRequiredService<BlobToS3Migrator>();
    await migrator.RunAsync(dropColumns, CancellationToken.None);
}
catch (Exception ex)
{
    logger.LogError(ex, fixUnidadeSchema ? "Correção de schema Unidade interrompida." : "Migração de BLOBs para o S3 interrompida.");
    return 1;
}

return 0;

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
