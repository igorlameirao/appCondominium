namespace AppCondominium.Domain.Entities;

public class EmailQueue
{
    public long Id { get; set; }
    public string Destinatario { get; set; } = string.Empty;
    public string Assunto { get; set; } = string.Empty;
    public string Corpo { get; set; } = string.Empty;
    public bool CorpoHtml { get; set; }
    public string Status { get; set; } = EmailQueueStatus.Pendente;
    public int Tentativas { get; set; }
    public DateTime? UltimaTentativa { get; set; }
    public string? MensagemErro { get; set; }
    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
    public DateTime? DataEnvio { get; set; }
}

public static class EmailQueueStatus
{
    public const string Pendente = "Pendente";
    public const string Enviando = "Enviando";
    public const string Enviado = "Enviado";
    public const string Erro = "Erro";
}