using AppCondominium.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace AppCondominium.Infrastructure.Persistence;

/// <summary>
/// Permite <c>dotnet ef migrations add</c> sem depender de ServerVersion.AutoDetect.
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    private const string UserSecretsId = "app-condominium-api-2026";

    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();

        var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
        var repoRoot = Directory.GetCurrentDirectory();
        var apiDir = ResolveApiSettingsDirectory(repoRoot);

        var configuration = new ConfigurationBuilder()
            .SetBasePath(apiDir)
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: false)
            .AddJsonFile($"appsettings.{env}.json", optional: true, reloadOnChange: false)
            .AddUserSecrets(UserSecretsId)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrWhiteSpace(connectionString))
        {
            var versionString = configuration["Database:MySqlServerVersion"] ?? "8.0.36-mysql";
            optionsBuilder.UseMySql(connectionString, ServerVersion.Parse(versionString));
            return new AppDbContext(optionsBuilder.Options, new DesignTimeTenant());
        }

        const string designTimeConnectionString = "Server=127.0.0.1;Port=3306;Database=_ef_design;User=_;Password=_;";
        optionsBuilder.UseMySql(designTimeConnectionString, ServerVersion.Parse("8.0.36-mysql"));
        return new AppDbContext(optionsBuilder.Options, new DesignTimeTenant());
    }

    private static string ResolveApiSettingsDirectory(string repoRoot)
    {
        var candidates = new[]
        {
            Path.Combine(repoRoot, "AppCondominium.API"),
            Path.GetFullPath(Path.Combine(repoRoot, "..", "AppCondominium.API")),
            Path.GetFullPath(Path.Combine(repoRoot, "..", "..", "AppCondominium.API")),
            Path.Combine(repoRoot, "WebApi", "AppCondominium.API"),
        };

        foreach (var dir in candidates)
        {
            if (Directory.Exists(dir))
                return dir;
        }

        return repoRoot;
    }

    private sealed class DesignTimeTenant : ICondominioContext
    {
        public uint? IdCondominio => null;
        public void SetCondominio(uint idCondominio) { }
        public void Clear() { }
        public uint RequireTenantId() => 0;
    }
}
