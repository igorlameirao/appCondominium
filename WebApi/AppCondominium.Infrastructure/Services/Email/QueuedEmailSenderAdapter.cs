using AppCondominium.Application.Interfaces;

namespace AppCondominium.Infrastructure.Services.Email;

/// <summary>Encaminha <see cref="IEmailSender"/> para a fila centralizada.</summary>
public sealed class QueuedEmailSenderAdapter : IEmailSender
{
    private readonly IEmailService _emailService;

    public QueuedEmailSenderAdapter(IEmailService emailService) => _emailService = emailService;

    public Task<long> EnviarAsync(EmailMessage mensagem, CancellationToken ct = default)
        => _emailService.EnfileirarAsync(
            mensagem.Destinatario,
            mensagem.Assunto,
            mensagem.CorpoHtml,
            html: true,
            ct);
}