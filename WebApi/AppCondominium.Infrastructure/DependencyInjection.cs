using AppCondominium.Application.Interfaces;
using AppCondominium.Infrastructure.Persistence;
using AppCondominium.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AppCondominium.Infrastructure;

public static partial class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        services.AddScoped<ICondominioContext, CondominioContext>();

        var cs = config.GetConnectionString("DefaultConnection")
            ?? "Server=localhost;Database=appcondominium;User=root;Password=mysql;";

        services.AddDbContext<AppDbContext>(o =>
            o.UseMySql(cs, ServerVersion.AutoDetect(cs)));

        RegisterGeneratedRepositories(services);
        return services;
    }

    static partial void RegisterGeneratedRepositories(IServiceCollection services);
}
