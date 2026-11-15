using System.Net;

namespace AppCondominium.Infrastructure.Services;

internal static class PasswordRecoveryEmailTemplate
{
    public static string MontarHtml(string nome, string link, DateTime expiraUtc)
    {
        var expiraLocal = expiraUtc.ToLocalTime().ToString("dd/MM/yyyy HH:mm");
        var linkEsc = WebUtility.HtmlEncode(link);
        var nomeEsc = WebUtility.HtmlEncode(nome);
        return $"""
            <p>Olá, {nomeEsc}.</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta no AppCondominium.</p>
            <p><a href="{linkEsc}">Redefinir senha</a></p>
            <p>Este link é válido até <strong>{WebUtility.HtmlEncode(expiraLocal)}</strong> e pode ser usado apenas uma vez.</p>
            <p>Se você não solicitou esta alteração, ignore este e-mail.</p>
            """;
    }

    public static string MontarTexto(string nome, string link, DateTime expiraUtc)
    {
        var expiraLocal = expiraUtc.ToLocalTime().ToString("dd/MM/yyyy HH:mm");
        return $"Olá, {nome}. Redefinição de senha AppCondominium. Link: {link} Válido até {expiraLocal}.";
    }
}