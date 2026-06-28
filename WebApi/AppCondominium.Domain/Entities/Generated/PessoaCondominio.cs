namespace AppCondominium.Domain.Entities;

public class PessoaCondominio
{
    public uint? IdPessoa { get; set; }
    public uint? IdCondominio { get; set; }
    public DateOnly? DataInicio { get; set; }
    public byte? TipoVinculo { get; set; }
    public DateOnly? DataFim { get; set; }
}