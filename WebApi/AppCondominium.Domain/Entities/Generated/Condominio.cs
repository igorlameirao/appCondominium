namespace AppCondominium.Domain.Entities;

public class Condominio
{
    public uint? IdCondominio { get; set; }
    public string? Nome { get; set; }
    public uint? IdEndereco { get; set; }
    public uint? NumeroEndereco { get; set; }
    public string? ComplementoEndereco { get; set; }
    public decimal? AreaTerreno { get; set; }
    public decimal? AreaTotalEdificada { get; set; }
    public decimal? AreaTotalUnidades { get; set; }
    public uint? QuantidadeTotalUnidades { get; set; }
    public string? CNPJ { get; set; }
}