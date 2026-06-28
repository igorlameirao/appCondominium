namespace AppCondominium.Domain.Entities;

public class TipoDespesa
{
    public uint? IdTipoDespesa { get; set; }
    public uint? IdCondominio { get; set; }
    public string? Descricao { get; set; }
    public string? TipoRateio { get; set; }
    public string? CodigoContabil { get; set; }
}