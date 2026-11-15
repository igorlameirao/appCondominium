namespace AppCondominium.Application.DTOs;

public class EmailQueueFiltroDto
{
    public string? Status { get; set; }
    public string? Destinatario { get; set; }
    public string? Assunto { get; set; }
    public DateOnly? DataInicio { get; set; }
    public DateOnly? DataFim { get; set; }
}

public class EmailQueueListItemDto
{
    public long Id { get; set; }
    public string Destinatario { get; set; } = string.Empty;
    public string Assunto { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int Tentativas { get; set; }
    public DateTime? UltimaTentativa { get; set; }
    public string? MensagemErro { get; set; }
    public DateTime DataCriacao { get; set; }
    public DateTime? DataEnvio { get; set; }
}

public class EmailQueueDetalheDto : EmailQueueListItemDto
{
    public string? CorpoPreview { get; set; }
}

public class EmailQueueReprocessarResultadoDto
{
    public bool Ok { get; set; }
    public string Mensagem { get; set; } = string.Empty;
    public EmailQueueListItemDto? Item { get; set; }
}