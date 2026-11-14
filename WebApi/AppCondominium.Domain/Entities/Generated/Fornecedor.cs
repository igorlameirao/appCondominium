namespace AppCondominium.Domain.Entities;

public class Fornecedor
{
    public uint? IdFornecedor { get; set; }
    public uint? IdPessoa { get; set; }
    public uint? IdCondominio { get; set; }
    public byte? Ativo { get; set; }
}