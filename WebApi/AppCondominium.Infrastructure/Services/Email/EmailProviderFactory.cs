using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;

namespace AppCondominium.Infrastructure.Services.Email;

public sealed class EmailProviderFactory : IEmailProviderFactory
{
    private readonly SmtpEmailProvider _smtp;

    public EmailProviderFactory(SmtpEmailProvider smtp) => _smtp = smtp;

    public IEmailProvider Resolve(string provedorCodigo)
    {
        var code = (provedorCodigo ?? "").Trim();
        if (string.Equals(code, EmailProvedorCodes.AmazonSesSmtp, StringComparison.OrdinalIgnoreCase)
            || string.Equals(code, EmailProvedorCodes.SmtpGenerico, StringComparison.OrdinalIgnoreCase))
            return _smtp;
        return _smtp;
    }
}