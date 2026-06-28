namespace AppCondominium.Domain.Entities;

public class PessoaJuridica
{
    public uint? IdPessoa { get; set; }
    public uint? IdResponsavel { get; set; }
    public string? NomeFantasia { get; set; }
    public DateOnly? DataFundacao { get; set; }
    public string? InscricaoEstadual { get; set; }
    public string? InscricaoMunicipal { get; set; }
}