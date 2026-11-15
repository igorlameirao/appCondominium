using System.Threading.Channels;
using AppCondominium.Application.Interfaces;

namespace AppCondominium.Infrastructure.Background;

public sealed class EmailQueuePump : IEmailQueuePump
{
    private readonly Channel<bool> _channel = Channel.CreateUnbounded<bool>(new UnboundedChannelOptions
    {
        SingleReader = true,
        SingleWriter = false,
        AllowSynchronousContinuations = false
    });

    public void Pulse() => _channel.Writer.TryWrite(true);

    public async Task WaitAsync(CancellationToken cancellationToken)
    {
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(TimeSpan.FromSeconds(3));
        try
        {
            await _channel.Reader.ReadAsync(cts.Token).ConfigureAwait(false);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            // ciclo periódico
        }

        while (_channel.Reader.TryRead(out _)) { }
    }
}