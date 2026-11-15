namespace AppCondominium.Domain.Entities;

public class RecuperacaoSenhaToken
{
    public uint IdRecuperacaoSenha { get; set; }
    public uint IdPessoa { get; set; }
    public string TokenHash { get; set; } = "";
    public string EmailNormalizado { get; set; } = "";
    public DateTime DataCriacao { get; set; }
    public DateTime DataExpiracao { get; set; }
    public byte Estado { get; set; }
    public DateTime? DataConsumo { get; set; }
    public long? IdEmailQueue { get; set; }
}