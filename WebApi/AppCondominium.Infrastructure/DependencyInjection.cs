using Amazon;
using Amazon.S3;
using AppCondominium.Application.Interfaces;
using AppCondominium.Application.Storage;
using AppCondominium.Infrastructure.Persistence;
using AppCondominium.Infrastructure.Services;
using AppCondominium.Infrastructure.Storage;
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
        services.AddScoped<ArquivoCleanupInterceptor>();
        services.AddScoped<IFaceEmbeddingSync, FaceEmbeddingSync>();
        RegistrarArmazenamento(services, config);

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
            options.AddInterceptors(
                sp.GetRequiredService<PessoafisicaSenhaInterceptor>(),
                sp.GetRequiredService<ArquivoCleanupInterceptor>());
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

    private static void RegistrarArmazenamento(IServiceCollection services, IConfiguration config)
    {
        var options = new StorageOptions();
        config.GetSection(StorageOptions.SectionName).Bind(options);
        if (string.IsNullOrWhiteSpace(options.EnvironmentPrefix))
            options.EnvironmentPrefix = "dev";
        if (string.IsNullOrWhiteSpace(options.Sistema))
            options.Sistema = "app-condominium";
        if (string.IsNullOrWhiteSpace(options.Region))
            options.Region = "us-east-1";

        services.AddSingleton(options);
        services.AddSingleton<StorageObjectKeyBuilder>();
        services.AddSingleton<IAmazonS3>(_ =>
        {
            var s3 = new AmazonS3Config();
            if (!string.IsNullOrWhiteSpace(options.ServiceUrl))
            {
                s3.ServiceURL = options.ServiceUrl;
                s3.ForcePathStyle = true;
                s3.AuthenticationRegion = options.Region;
            }
            else
            {
                s3.RegionEndpoint = RegionEndpoint.GetBySystemName(options.Region);
            }

            if (!string.IsNullOrWhiteSpace(options.AccessKey) && !string.IsNullOrWhiteSpace(options.SecretKey))
                return new AmazonS3Client(options.AccessKey, options.SecretKey, s3);
            return new AmazonS3Client(s3);
        });
        services.AddSingleton<IObjectStorage, S3ObjectStorage>();
        services.AddSingleton<IArquivoStorage, ArquivoStorage>();
    }

    static partial void RegisterGeneratedRepositories(IServiceCollection services);
}
