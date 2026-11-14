namespace AppCondominium.Domain.Entities;

public class PessoaVinculo
{
    public uint? IdVinculo { get; set; }
    public uint? IdPessoa { get; set; }
    public uint? CodigoPapelVinculo { get; set; }
    public uint? IdCondominio { get; set; }
    public uint? IdUnidade { get; set; }
    public uint? IdPessoaRelacionada { get; set; }
    public DateOnly? DataInicio { get; set; }
    public DateOnly? DataFim { get; set; }
    public uint? IdPerfil { get; set; }
    public byte? Responsavel { get; set; }
    public string? Observacao { get; set; }
}