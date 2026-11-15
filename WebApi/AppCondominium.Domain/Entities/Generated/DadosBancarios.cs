namespace AppCondominium.Domain.Entities;

public partial class DadosBancarios
{
    public uint? Conta { get; set; }
    public uint? IdBanco { get; set; }
    public string? Agencia { get; set; }
    public string? DigitoAgencia { get; set; }
    public string? DigitoConta { get; set; }
    public uint? IdCondominio { get; set; }
    public byte? Ativo { get; set; }
    public DateTime? DataCadastro { get; set; }
    public uint? CodigoEmpresaCobranca { get; set; }
}