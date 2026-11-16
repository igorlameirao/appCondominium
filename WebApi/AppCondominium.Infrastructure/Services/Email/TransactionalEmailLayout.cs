using System.Net;

namespace AppCondominium.Infrastructure.Services.Email;

/// <summary>Layout HTML institucional reutilizável para e-mails transacionais.</summary>
internal static class TransactionalEmailLayout
{
    public const string NomeProduto = "AppCondominium";
    public const string SubtituloProduto = "Sistema de Gestão de Condomínios";
    public const string LogoPadraoHttps =
        "https://appcondominium.com.br/assets/login/logo-appcondominium.jpg";
    public const string CaminhoLogo = "/assets/login/logo-appcondominium.jpg";

    public sealed class Conteudo
    {
        public required string Titulo { get; init; }
        public required string CorpoHtml { get; init; }
        public string IconeDestaque { get; init; } = "&#128274;";
        public string? RotuloBotao { get; init; }
        public string? UrlBotao { get; init; }
        public string? BlocoInformativoHtml { get; init; }
        public string? AvisoSegurancaHtml { get; init; }
        public required string LogoUrl { get; init; }
    }

    public static string ResolverLogoUrlDesdeUrlPublica(string urlPublica)
    {
        if (string.IsNullOrWhiteSpace(urlPublica))
            return LogoPadraoHttps;

        try
        {
            var uri = new Uri(urlPublica.Trim(), UriKind.Absolute);
            if (!string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
                return LogoPadraoHttps;
            var origem = uri.GetLeftPart(UriPartial.Authority).TrimEnd('/');
            return $"{origem}{CaminhoLogo}";
        }
        catch (UriFormatException)
        {
            return LogoPadraoHttps;
        }
    }

    public static string MontarHtml(Conteudo conteudo)
    {
        var titulo = WebUtility.HtmlEncode(conteudo.Titulo);
        var logo = WebUtility.HtmlEncode(conteudo.LogoUrl);
        var corpo = conteudo.CorpoHtml;
        var icone = conteudo.IconeDestaque;

        var botao = MontarBotao(conteudo.RotuloBotao, conteudo.UrlBotao);
        var info = string.IsNullOrWhiteSpace(conteudo.BlocoInformativoHtml)
            ? string.Empty
            : $"""
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 0;">
                <tr>
                  <td style="background-color:#eaf2ff;border:1px solid #bfdbfe;border-radius:6px;padding:16px 18px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55;color:#1e3a5f;">
                    {conteudo.BlocoInformativoHtml}
                  </td>
                </tr>
              </table>
              """;

        var aviso = string.IsNullOrWhiteSpace(conteudo.AvisoSegurancaHtml)
            ? string.Empty
            : $"""
              <p style="margin:20px 0 0;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;color:#64748b;">
                {conteudo.AvisoSegurancaHtml}
              </p>
              """;

        var fallbackLink = MontarFallbackLink(conteudo.UrlBotao);

        return $"""
<!DOCTYPE html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <meta name="color-scheme" content="light dark"/>
  <meta name="supported-color-schemes" content="light dark"/>
  <title>{titulo} — {NomeProduto}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;width:100%;background-color:#e6f2fa;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">{titulo} — {NomeProduto}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#e6f2fa;min-width:100%;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background-color:#0d6efd;padding:20px 24px;text-align:center;">
              <img src="{logo}" width="160" height="auto" alt="{WebUtility.HtmlEncode(NomeProduto)}" style="display:block;margin:0 auto 10px;max-width:160px;height:auto;border:0;outline:none;text-decoration:none;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:18px;font-weight:700;color:#ffffff;"/>
              <p style="margin:0;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.4;color:#e0eaff;">{SubtituloProduto}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding:0 0 16px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
                      <tr>
                        <td align="center" width="56" height="56" style="width:56px;height:56px;background-color:#eaf2ff;border-radius:28px;font-size:26px;line-height:56px;color:#0d6efd;">{icone}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 0 20px;">
                    <h1 style="margin:0;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:22px;line-height:1.3;font-weight:700;color:#0f172a;">{titulo}</h1>
                  </td>
                </tr>
              </table>
              <div style="font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#334155;">
                {corpo}
              </div>
              {botao}
              {info}
              {aviso}
              {fallbackLink}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 20px;border-top:1px solid #e2e8f0;background-color:#f8fafc;text-align:center;">
              <p style="margin:0 0 4px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#64748b;font-weight:600;">{NomeProduto}</p>
              <p style="margin:0;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:11px;line-height:1.45;color:#94a3b8;">Mensagem automática — não responda a este e-mail.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
""";
    }

    private static string MontarBotao(string? rotulo, string? url)
    {
        if (string.IsNullOrWhiteSpace(rotulo) || string.IsNullOrWhiteSpace(url))
            return string.Empty;

        var rotuloEsc = WebUtility.HtmlEncode(rotulo);
        var urlEsc = WebUtility.HtmlEncode(url);

        return $"""
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 0;">
            <tr>
              <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td align="center" style="border-radius:6px;background-color:#0d6efd;">
                      <a href="{urlEsc}" target="_blank" style="display:inline-block;min-width:200px;padding:14px 28px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;line-height:1.25;color:#ffffff;text-decoration:none;border-radius:6px;mso-padding-alt:0;text-align:center;">{rotuloEsc}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          """;
    }

    private static string MontarFallbackLink(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return string.Empty;

        var urlEsc = WebUtility.HtmlEncode(url);
        return $"""
          <p style="margin:24px 0 0;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.55;color:#64748b;word-break:break-all;">
            Se o botão não funcionar, copie e cole este link no navegador:<br/>
            <a href="{urlEsc}" target="_blank" style="color:#0d6efd;text-decoration:underline;">{urlEsc}</a>
          </p>
          """;
    }
}