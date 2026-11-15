namespace AppCondominium.Application.Interfaces;

public record EmailMessage(
    string Destinatario,
    string Assunto,
    string CorpoHtml,
    string? CorpoTexto = null);

public interface IEmailSender
{
    /// <summary>Enfileira o e-mail. Retorna o Id na fila ou 0 se ignorado.</summary>
    Task<long> EnviarAsync(EmailMessage mensagem, CancellationToken ct = default);
}