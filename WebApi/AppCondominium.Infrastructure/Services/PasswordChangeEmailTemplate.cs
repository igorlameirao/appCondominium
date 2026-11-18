using System.Net;
using AppCondominium.Infrastructure.Services.Email;

namespace AppCondominium.Infrastructure.Services;

public static class PasswordChangeEmailTemplate
{
    public static string MontarHtml(string nome, DateTime alteradoUtc)
    {
        var quando = alteradoUtc.ToLocalTime().ToString("dd/MM/yyyy HH:mm");
        var nomeEsc = WebUtility.HtmlEncode(nome);
        var quandoEsc = WebUtility.HtmlEncode(quando);

        var corpo = $"""
            <p style="margin:0 0 12px;">Olá, <strong>{nomeEsc}</strong>.</p>
            <p style="margin:0;">A senha da sua conta no AppCondominium foi alterada com sucesso.</p>
            """;

        var blocoInfo = $"""
            Data e hora da alteração: <strong>{quandoEsc}</strong>.
            """;

        return TransactionalEmailLayout.MontarHtml(new TransactionalEmailLayout.Conteudo
        {
            Titulo = "Senha alterada",
            CorpoHtml = corpo,
            BlocoInformativoHtml = blocoInfo,
            AvisoSegurancaHtml = "Se você não realizou esta alteração, entre em contato com o administrador do seu condomínio imediatamente.",
            LogoUrl = TransactionalEmailLayout.LogoPadraoHttps,
        });
    }

    public static string MontarTexto(string nome, DateTime alteradoUtc)
    {
        var quando = alteradoUtc.ToLocalTime().ToString("dd/MM/yyyy HH:mm");
        return $"""
            Olá, {nome}.

            Senha alterada — AppCondominium

            A senha da sua conta foi alterada com sucesso em {quando}.

            Se você não realizou esta alteração, entre em contato com o administrador do seu condomínio imediatamente.

            AppCondominium — mensagem automática.
            """;
    }
}