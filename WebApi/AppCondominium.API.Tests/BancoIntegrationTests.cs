using AppCondominium.Infrastructure;
using AppCondominium.Infrastructure.Persistence;
using AppCondominium.Infrastructure.Repositories.Generated;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace AppCondominium.API.Tests;

[Trait("Category", "RdsIntegration")]
public class BancoIntegrationTests
{
    private static bool Habilitado =>
        string.Equals(Environment.GetEnvironmentVariable("APP_INTEGRATION_RDS"), "1", StringComparison.Ordinal);

    [Fact]
    public async Task Banco_GetPagedAsync_materializa_sem_InvalidCast()
    {
        if (!Habilitado)
        {
            Assert.True(true, "Ignorado: defina APP_INTEGRATION_RDS=1 para testes no RDS.");
            return;
        }

        var root = CriarServicos();
        await using var scope = root.CreateAsyncScope();
        var repo = scope.ServiceProvider.GetRequiredService<BancoRepository>();

        var page = await repo.GetPagedAsync(1, 20, filter: null);
        Assert.NotNull(page.Items);
        Assert.True(page.TotalCount > 0, "Esperado ao menos um banco no RDS.");
        Assert.NotEmpty(page.Items);
    }

    private static IServiceProvider CriarServicos()
    {
        var apiDir = EncontrarApiDir();
        var config = new ConfigurationBuilder()
            .AddJsonFile(Path.Combine(apiDir, "appsettings.json"))
            .AddJsonFile(Path.Combine(apiDir, "appsettings.Development.json"), optional: true)
            .AddJsonFile(CaminhoUserSecrets(), optional: true)
            .AddEnvironmentVariables()
            .Build();

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddInfrastructure(config);
        return services.BuildServiceProvider(validateScopes: true);
    }

    private static string CaminhoUserSecrets() =>
        Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "Microsoft", "UserSecrets", "app-condominium-api-2026", "secrets.json");

    private static string EncontrarApiDir()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null)
        {
            var candidato = Path.Combine(dir.FullName, "WebApi", "AppCondominium.API");
            if (File.Exists(Path.Combine(candidato, "appsettings.json")))
                return candidato;
            dir = dir.Parent;
        }

        throw new InvalidOperationException("AppCondominium.API não encontrado.");
    }
}