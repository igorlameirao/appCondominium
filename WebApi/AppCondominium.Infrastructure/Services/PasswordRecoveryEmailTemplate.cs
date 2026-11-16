using System.Net;
using AppCondominium.Infrastructure.Services.Email;

namespace AppCondominium.Infrastructure.Services;

internal static class PasswordRecoveryEmailTemplate
{
    public static string MontarHtml(string nome, string link, DateTime expiraUtc)
    {
        var expiraLocal = expiraUtc.ToLocalTime().ToString("dd/MM/yyyy HH:mm");
        var nomeEsc = WebUtility.HtmlEncode(nome);
        var expiraEsc = WebUtility.HtmlEncode(expiraLocal);
        var logoUrl = TransactionalEmailLayout.ResolverLogoUrlDesdeUrlPublica(link);

        var corpo = $"""
            <p style="margin:0 0 12px;">Olá, <strong>{nomeEsc}</strong>.</p>
            <p style="margin:0;">Recebemos uma solicitação para redefinir a senha da sua conta no AppCondominium. Clique no botão abaixo para criar uma nova senha.</p>
            """;

        var blocoInfo = $"""
            Este link é válido até <strong>{expiraEsc}</strong> e pode ser usado apenas <strong>uma vez</strong>.
            """;

        return TransactionalEmailLayout.MontarHtml(new TransactionalEmailLayout.Conteudo
        {
            Titulo = "Redefinição de senha",
            CorpoHtml = corpo,
            RotuloBotao = "Redefinir minha senha",
            UrlBotao = link,
            BlocoInformativoHtml = blocoInfo,
            AvisoSegurancaHtml = "Se você não solicitou esta alteração, ignore este e-mail.",
            LogoUrl = logoUrl
        });
    }

    public static string MontarTexto(string nome, string link, DateTime expiraUtc)
    {
        var expiraLocal = expiraUtc.ToLocalTime().ToString("dd/MM/yyyy HH:mm");
        return $"""
            Olá, {nome}.

            Redefinição de senha — AppCondominium

            Recebemos uma solicitação para redefinir a senha da sua conta.
            Acesse o link abaixo para criar uma nova senha:
            {link}

            Este link é válido até {expiraLocal} e pode ser usado apenas uma vez.
            Se você não solicitou esta alteração, ignore este e-mail.

            AppCondominium — mensagem automática.
            """;
    }
}