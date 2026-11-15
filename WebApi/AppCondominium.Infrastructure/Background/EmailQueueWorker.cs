using AppCondominium.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AppCondominium.Infrastructure.Background;

public sealed class EmailQueueWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IEmailQueuePump _pump;
    private readonly ILogger<EmailQueueWorker> _logger;

    public EmailQueueWorker(
        IServiceScopeFactory scopeFactory,
        IEmailQueuePump pump,
        ILogger<EmailQueueWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _pump = pump;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try { await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken); }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { return; }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var email = scope.ServiceProvider.GetRequiredService<IEmailService>();
                var n = await email.ProcessarFilaAsync(20, stoppingToken);
                if (n > 0)
                    _logger.LogInformation("EmailQueueWorker: {Count} e-mail(s) enviado(s).", n);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Falha no worker da fila de e-mails.");
            }

            try { await _pump.WaitAsync(stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
        }
    }
}