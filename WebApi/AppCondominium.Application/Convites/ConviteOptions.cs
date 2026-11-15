namespace AppCondominium.Application.Convites;

public class ConviteOptions
{
    public const string SectionName = "Convites";

    /// <summary>Validade padrão do convite em horas.</summary>
    public int ValidadeHoras { get; set; } = 72;

    /// <summary>URL base pública para o link de aceite (Angular), sem barra final.</summary>
    public string AceiteBaseUrl { get; set; } = "https://app.example.com/convite/aceitar";

    public int MaxTentativasEnvioEmail { get; set; } = 5;
}

public class SmtpOptions
{
    public const string SectionName = "Smtp";

    public bool Habilitado { get; set; }
    public string Host { get; set; } = "";
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; } = true;
    public string? Usuario { get; set; }
    public string? Senha { get; set; }
    public string RemetenteEmail { get; set; } = "noreply@example.com";
    public string RemetenteNome { get; set; } = "AppCondominium";
}