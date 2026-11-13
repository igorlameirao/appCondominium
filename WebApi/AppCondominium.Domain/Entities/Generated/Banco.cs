namespace AppCondominium.Domain.Entities;

public partial class Banco
{
    public uint? IdBanco { get; set; }
    public string? CodigoBanco { get; set; }
    public string? DigitoVerificador { get; set; }
    public string? Nome { get; set; }
    public string? ISPB { get; set; }
    public string? CNPJ { get; set; }
    public byte? Ativo { get; set; }
}