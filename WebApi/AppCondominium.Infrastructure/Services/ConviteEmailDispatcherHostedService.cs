using AppCondominium.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AppCondominium.Infrastructure.Services;

/// <summary>Reprocessa envios de convite pendentes ou com falha.</summary>
public class ConviteEmailDispatcherHostedService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ConviteEmailDispatcherHostedService> _logger;

    public ConviteEmailDispatcherHostedService(
        IServiceScopeFactory scopeFactory,
        ILogger<ConviteEmailDispatcherHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = _scopeFactory.CreateAsyncScope();
                var convites = scope.ServiceProvider.GetRequiredService<IConviteAcessoService>();
                await convites.ProcessarEnviosPendentesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Ciclo de reenvio de convites falhou.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);
            }
            catch (TaskCanceledException)
            {
                break;
            }
        }
    }
}