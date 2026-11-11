using AppCondominium.Application.Interfaces;
using AppCondominium.Infrastructure.Persistence;
using AppCondominium.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using PasswordHasherService = AppCondominium.Infrastructure.Services.PasswordHasher;

namespace AppCondominium.Infrastructure;

public static partial class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        services.AddScoped<ICondominioContext, CondominioContext>();
        services.AddScoped<ITenantAccessService, TenantAccessService>();
        services.AddScoped<IPermissionResolver, PermissionResolver>();
        services.AddSingleton<IPasswordHasher, PasswordHasherService>();
        services.AddSingleton<PessoafisicaSenhaInterceptor>();

        var (connectionString, tunnel) = MySqlConnectionSetup.Resolve(config);
        if (tunnel is not null)
            services.AddSingleton(tunnel);

        // Evita ServerVersion.AutoDetect: abre uma conexão extra em cada arranque e agravava "Too many connections" no MySQL/RDS.
        var versionString = config["Database:MySqlServerVersion"] ?? "8.0.36-mysql";
        var serverVersion = ServerVersion.Parse(versionString);

        var maxPool = config.GetValue<int?>("Database:MaxPoolSize");
        if (maxPool is > 0 && connectionString.IndexOf("Maximum Pool Size", StringComparison.OrdinalIgnoreCase) < 0)
        {
            connectionString = $"{connectionString.TrimEnd(';', ' ')};Maximum Pool Size={maxPool.Value}";
        }

        services.AddDbContext<AppDbContext>((sp, options) =>
        {
            options.AddInterceptors(sp.GetRequiredService<PessoafisicaSenhaInterceptor>());
            options.UseMySql(connectionString, serverVersion, mySql =>
            {
                mySql.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorNumbersToAdd: Array.Empty<int>());
            });
        });

        RegisterGeneratedRepositories(services);
        return services;
    }

    static partial void RegisterGeneratedRepositories(IServiceCollection services);
}
