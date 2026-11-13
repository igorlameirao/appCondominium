using AppCondominium.Infrastructure;
using AppCondominium.Tools;
using AppCondominium.Tools.Bancos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

var importarBancos = args.Length > 0 && string.Equals(args[0], "importar-bancos", StringComparison.OrdinalIgnoreCase);
var dropColumns = args.Any(a => string.Equals(a, "--drop-columns", StringComparison.OrdinalIgnoreCase));
var apiDir = EncontrarApi();

var builder = Host.CreateApplicationBuilder(new HostApplicationBuilderSettings
{
    Args = importarBancos ? Array.Empty<string>() : args,
    ContentRootPath = apiDir
});
builder.Configuration
    .AddJsonFile(Path.Combine(apiDir, "appsettings.json"), optional: false)
    .AddJsonFile(Path.Combine(apiDir, "appsettings.Development.json"), optional: true)
    .AddJsonFile(CaminhoUserSecrets(), optional: true)
    .AddEnvironmentVariables();

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddTransient<BlobToS3Migrator>();
builder.Services.AddTransient<BancoImportador>();

using var host = builder.Build();
var logger = host.Services.GetRequiredService<ILoggerFactory>().CreateLogger(importarBancos ? "importar-bancos" : "migrate-blobs-to-s3");
try
{
    using var scope = host.Services.CreateScope();
    if (importarBancos)
    {
        var downloads = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Downloads");
        var json = Opcao("--json") ?? Path.Combine(downloads, "bancos.txtr");
        var csv = Opcao("--csv") ?? Path.Combine(downloads, "ParticipantesSTR.csv");
        var relatorio = Opcao("--relatorio") ?? Path.Combine(Path.GetTempPath(), "AppCondominium", "importacao-bancos");
        var aplicar = args.Any(a => string.Equals(a, "--aplicar", StringComparison.OrdinalIgnoreCase));
        var importador = scope.ServiceProvider.GetRequiredService<BancoImportador>();
        return await importador.RunAsync(json, csv, aplicar, relatorio, CancellationToken.None);
    }

    var migrator = scope.ServiceProvider.GetRequiredService<BlobToS3Migrator>();
    await migrator.RunAsync(dropColumns, CancellationToken.None);
}
catch (Exception ex)
{
    logger.LogError(ex, importarBancos ? "Importação de bancos interrompida." : "Migração de BLOBs para o S3 interrompida.");
    return 1;
}

return 0;

string? Opcao(string nome)
{
    var i = Array.FindIndex(args, a => string.Equals(a, nome, StringComparison.OrdinalIgnoreCase));
    return i >= 0 && i + 1 < args.Length ? args[i + 1] : null;
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
