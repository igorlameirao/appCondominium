using System.Net.Sockets;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Logging;

namespace AppCondominium.Infrastructure.Services.Email;

public sealed class SmtpEmailProvider : IEmailProvider
{
    private readonly ILogger<SmtpEmailProvider> _logger;

    public SmtpEmailProvider(ILogger<SmtpEmailProvider> logger) => _logger = logger;

    public string CodigoProvedor => EmailProvedorCodes.SmtpGenerico;

    public async Task<(bool ok, string mensagem)> TestarConexaoAsync(
        ConfiguracaoEmail cfg, string senhaPlain, CancellationToken ct = default)
    {
        try
        {
            using var client = CreateClient(cfg);
            await ConnectAndAuthAsync(client, cfg, senhaPlain, ct);
            await client.DisconnectAsync(true, ct);
            return (true, "Conexão realizada com sucesso.");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Falha no teste de conexão SMTP {Host}:{Port}", cfg.ServidorSmtp, cfg.Porta);
            return (false, FormatUserFacingError(ex));
        }
    }

    public async Task<(bool ok, string mensagem, string? exceptionDetail)> EnviarAsync(
        ConfiguracaoEmail cfg, string senhaPlain, string destinatario, string assunto, string corpo, bool html = false,
        CancellationToken ct = default)
    {
        var lote = await EnviarVariosAsync(cfg, senhaPlain,
            new[] { (destinatario, assunto, corpo, html) }, ct);
        var r = lote[0];
        return r;
    }

    public async Task<IReadOnlyList<(bool ok, string mensagem, string? exceptionDetail)>> EnviarVariosAsync(
        ConfiguracaoEmail cfg, string senhaPlain,
        IReadOnlyList<(string Destinatario, string Assunto, string Corpo, bool Html)> mensagens,
        CancellationToken ct = default)
    {
        var results = new (bool ok, string mensagem, string? exceptionDetail)[mensagens.Count];
        if (mensagens.Count == 0) return results;

        using var client = CreateClient(cfg);
        try
        {
            await ConnectAndAuthAsync(client, cfg, senhaPlain, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao conectar SMTP {Host}:{Port}", cfg.ServidorSmtp, cfg.Porta);
            var fail = (false, FormatUserFacingError(ex), (string?)ex.GetType().Name);
            for (var i = 0; i < results.Length; i++)
                results[i] = fail;
            return results;
        }

        for (var i = 0; i < mensagens.Count; i++)
        {
            ct.ThrowIfCancellationRequested();
            var m = mensagens[i];
            try
            {
                var message = BuildMime(cfg, m.Destinatario, m.Assunto, m.Corpo, m.Html);
                await client.SendAsync(message, ct);
                results[i] = (true, "E-mail enviado com sucesso.", null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Falha ao enviar e-mail SMTP para destinatário informado");
                results[i] = (false, FormatUserFacingError(ex), ex.GetType().Name);
            }
        }

        try { await client.DisconnectAsync(true, ct); }
        catch { /* sessão já encerrada */ }
        return results;
    }

    private static MimeMessage BuildMime(
        ConfiguracaoEmail cfg, string destinatario, string assunto, string corpo, bool html)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(cfg.NomeRemetente, cfg.EmailRemetente));
        message.To.Add(MailboxAddress.Parse(destinatario));
        message.Subject = assunto;
        if (!string.IsNullOrWhiteSpace(cfg.ReplyTo))
            message.ReplyTo.Add(MailboxAddress.Parse(cfg.ReplyTo));
        message.Body = html
            ? new TextPart("html") { Text = corpo }
            : new TextPart("plain") { Text = corpo };
        return message;
    }

    private static SmtpClient CreateClient(ConfiguracaoEmail cfg) =>
        new() { Timeout = Math.Max(5, cfg.TimeoutSegundos) * 1000 };

    private static async Task ConnectAndAuthAsync(
        SmtpClient client, ConfiguracaoEmail cfg, string senhaPlain, CancellationToken ct)
    {
        var options = ResolveSecureOptions(cfg);
        await client.ConnectAsync(cfg.ServidorSmtp.Trim(), cfg.Porta, options, ct);
        if (!string.IsNullOrWhiteSpace(cfg.UsuarioSmtp))
            await client.AuthenticateAsync(cfg.UsuarioSmtp.Trim(), senhaPlain ?? string.Empty, ct);
    }

    private static SecureSocketOptions ResolveSecureOptions(ConfiguracaoEmail cfg)
    {
        if (cfg.StartTls) return SecureSocketOptions.StartTls;
        if (cfg.Ssl) return SecureSocketOptions.SslOnConnect;
        if (cfg.Porta == 587) return SecureSocketOptions.StartTlsWhenAvailable;
        return SecureSocketOptions.None;
    }

    internal static string FormatUserFacingError(Exception ex)
    {
        if (IsConnectionFailure(ex))
            return "Servidor indisponível.";
        for (var e = ex; e != null; e = e.InnerException!)
        {
            if (e is SmtpCommandException or SmtpProtocolException && !string.IsNullOrWhiteSpace(e.Message))
                return e.Message.Trim();
        }
        return string.IsNullOrWhiteSpace(ex.Message) ? ex.GetType().Name : ex.Message.Trim();
    }

    private static bool IsConnectionFailure(Exception ex)
    {
        for (var e = ex; e != null; e = e.InnerException!)
        {
            if (e is SocketException se)
            {
                return se.SocketErrorCode is
                    SocketError.ConnectionRefused or SocketError.HostUnreachable or SocketError.NetworkUnreachable
                    or SocketError.HostNotFound or SocketError.TimedOut or SocketError.TryAgain
                    or SocketError.ConnectionReset or SocketError.ConnectionAborted;
            }
        }
        return false;
    }
}