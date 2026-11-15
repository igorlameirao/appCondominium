namespace AppCondominium.Application.DTOs;

public class ConfiguracaoEmailDto
{
    public int Id { get; set; }
    public string Provedor { get; set; } = "SmtpGenerico";
    public string ServidorSmtp { get; set; } = string.Empty;
    public int Porta { get; set; } = 587;
    public bool Ssl { get; set; } = true;
    public bool StartTls { get; set; }
    public int TimeoutSegundos { get; set; } = 30;
    public string UsuarioSmtp { get; set; } = string.Empty;
    public bool SenhaConfigurada { get; set; }
    public bool SenhaRequerAtualizacao { get; set; }
    public string NomeRemetente { get; set; } = string.Empty;
    public string EmailRemetente { get; set; } = string.Empty;
    public string? ReplyTo { get; set; }
    public DateTime DataCadastro { get; set; }
    public DateTime? DataAtualizacao { get; set; }
    public bool Ativo { get; set; } = true;
}

public class ConfiguracaoEmailUpsertDto
{
    public string Provedor { get; set; } = "SmtpGenerico";
    public string ServidorSmtp { get; set; } = string.Empty;
    public int Porta { get; set; } = 587;
    public bool Ssl { get; set; } = true;
    public bool StartTls { get; set; }
    public int TimeoutSegundos { get; set; } = 30;
    public string UsuarioSmtp { get; set; } = string.Empty;
    public string? Senha { get; set; }
    public string NomeRemetente { get; set; } = string.Empty;
    public string EmailRemetente { get; set; } = string.Empty;
    public string? ReplyTo { get; set; }
    public bool Ativo { get; set; } = true;
}

public class EmailTesteConexaoResultadoDto
{
    public bool Sucesso { get; set; }
    public string Mensagem { get; set; } = string.Empty;
    public int DuracaoMs { get; set; }
}

public class EmailTesteEnvioRequestDto
{
    public string Destinatario { get; set; } = string.Empty;
}

public class EmailTesteEnvioResultadoDto
{
    public bool Sucesso { get; set; }
    public string Mensagem { get; set; } = string.Empty;
    public DateTime DataHoraUtc { get; set; }
    public int DuracaoMs { get; set; }
    public string? NomeRemetente { get; set; }
    public string? EmailRemetente { get; set; }
    public string? ReplyTo { get; set; }
    public string? Destinatario { get; set; }
    public string? Assunto { get; set; }
    public string? Provedor { get; set; }
    public string? ServidorSmtp { get; set; }
    public int? Porta { get; set; }
    public string? MensagemRetorno { get; set; }
}