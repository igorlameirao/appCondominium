using System.Net;
using System.Net.Mail;
using AppCondominium.Application.Convites;
using AppCondominium.Application.Interfaces;
using Microsoft.Extensions.Options;

namespace AppCondominium.Infrastructure.Services;

public class SmtpEmailSender : IEmailSender
{
    private readonly SmtpOptions _options;

    public SmtpEmailSender(IOptions<SmtpOptions> options) => _options = options.Value;

    public async Task<long> EnviarAsync(EmailMessage mensagem, CancellationToken ct = default)
    {
        if (!_options.Habilitado)
            throw new InvalidOperationException("SMTP não está habilitado.");

        using var smtp = new SmtpClient(_options.Host, _options.Port)
        {
            EnableSsl = _options.UseSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            UseDefaultCredentials = false
        };

        if (!string.IsNullOrWhiteSpace(_options.Usuario))
            smtp.Credentials = new NetworkCredential(_options.Usuario, _options.Senha);

        using var mail = new MailMessage
        {
            From = new MailAddress(_options.RemetenteEmail, _options.RemetenteNome),
            Subject = mensagem.Assunto,
            Body = mensagem.CorpoHtml,
            IsBodyHtml = true
        };
        mail.To.Add(mensagem.Destinatario);
        if (!string.IsNullOrWhiteSpace(mensagem.CorpoTexto))
            mail.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(
                mensagem.CorpoTexto, null, "text/plain"));

        await smtp.SendMailAsync(mail, ct);
        return 1;
    }
}