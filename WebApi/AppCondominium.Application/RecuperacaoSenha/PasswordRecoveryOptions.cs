namespace AppCondominium.Application.RecuperacaoSenha;

public class PasswordRecoveryOptions
{
    public const string SectionName = "RecuperacaoSenha";

    /// <summary>Validade do token em minutos (padrão 30).</summary>
    public int ValidadeMinutos { get; set; } = 30;

    /// <summary>URL base pública para redefinição (Angular), sem barra final. Query: ?token=</summary>
    public string RedefinirBaseUrl { get; set; } = "https://app.example.com/recuperacao-senha/redefinir";
}