namespace AppCondominium.Domain.Entities;

/// <summary>Vínculo N:N entre Pessoa e Endereco (PK composta).</summary>
public class PessoaEndereco
{
    public uint IdPessoa { get; set; }
    public uint IdEndereco { get; set; }
    public uint? NumeroEndereco { get; set; }
    public string? ComplementoEndereco { get; set; }
    /// <summary>0 Principal, 1 Secundário, 2 Inativo.</summary>
    public byte TipoEndereco { get; set; }
}