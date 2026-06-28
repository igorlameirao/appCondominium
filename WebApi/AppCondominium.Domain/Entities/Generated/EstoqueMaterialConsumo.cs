namespace AppCondominium.Domain.Entities;

public class EstoqueMaterialConsumo
{
    public uint? IdEstoqueMaterialConsumo { get; set; }
    public uint? IdCondominio { get; set; }
    public uint? IdTipoMaterial { get; set; }
    public DateTime? DataValidade { get; set; }
    public string? Lote { get; set; }
    public DateTime? DataUltimaAquisicao { get; set; }
    public decimal? ValorUnitarioUltimaAquisicao { get; set; }
    public decimal? ValorUnitarioMedio { get; set; }
    public decimal? Quantidade { get; set; }
    public string? ValorTotal { get; set; }
    public byte? UnidadeMedida { get; set; }
    public uint? IdLocal { get; set; }
}