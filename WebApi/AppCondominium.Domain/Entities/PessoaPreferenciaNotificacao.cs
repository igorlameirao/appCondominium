namespace AppCondominium.Domain.Entities;

/// <summary>Preferência global de notificação por pessoa e categoria (PK composta).</summary>
public class PessoaPreferenciaNotificacao
{
    public uint IdPessoa { get; set; }
    public string CodigoTipo { get; set; } = null!;
    public bool AtivoPush { get; set; }
    public bool AtivoEmail { get; set; }
    public DateTime DataAtualizacao { get; set; }
}