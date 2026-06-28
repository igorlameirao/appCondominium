namespace AppCondominium.Domain.Entities;

public class Material
{
    public uint? IdMaterial { get; set; }
    public uint? IdCondominio { get; set; }
    public DateOnly? DataAquisicao { get; set; }
    public string? Patrimonio { get; set; }
    public string? Descricao { get; set; }
    public uint? IdTipoMaterial { get; set; }
    public uint? VidaUtil { get; set; }
    public decimal? ValorAquisicao { get; set; }
    public decimal? ValorDepreciavel { get; set; }
    public string? ValorDepreciacao { get; set; }
    public string? ValorQuotaDepreciacao { get; set; }
    public string? ValorContabil { get; set; }
}