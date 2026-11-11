namespace AppCondominium.Domain.Entities;

public class PessoaUnidade
{
    public uint? IdPessoa { get; set; }
    public uint? IdUnidade { get; set; }
    public byte? TipoVinculo { get; set; }
    public DateOnly? DataInicio { get; set; }
    public DateOnly? DataFim { get; set; }
}
