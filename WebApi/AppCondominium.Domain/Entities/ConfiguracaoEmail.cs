namespace AppCondominium.Domain.Entities;

/// <summary>Configuração SMTP singleton do sistema (global, fora do escopo de tenant).</summary>
public class ConfiguracaoEmail
{
    public int Id { get; set; }
    public string Provedor { get; set; } = EmailProvedorCodes.SmtpGenerico;
    public string ServidorSmtp { get; set; } = string.Empty;
    public int Porta { get; set; } = 587;
    public bool Ssl { get; set; } = true;
    public bool StartTls { get; set; }
    public int TimeoutSegundos { get; set; } = 30;
    public string UsuarioSmtp { get; set; } = string.Empty;
  /// <summary>Senha protegida (nunca texto puro).</summary>
    public string SenhaCriptografada { get; set; } = string.Empty;
    public string NomeRemetente { get; set; } = string.Empty;
    public string EmailRemetente { get; set; } = string.Empty;
    public string? ReplyTo { get; set; }
    public DateTime DataCadastro { get; set; } = DateTime.UtcNow;
    public DateTime? DataAtualizacao { get; set; }
    public bool Ativo { get; set; } = true;
}