namespace AppCondominium.Domain.Entities;

public class EntradaSaidaMaterialConsumo
{
    public ulong? IdEntradaSaidaMaterialConsumo { get; set; }
    public uint? IdCondominio { get; set; }
    public byte? TipoLancamento { get; set; }
    public ulong? IdEstoqueMaterialConsumo { get; set; }
    public uint? IdTipoMaterial { get; set; }
    public DateTime? DataValidade { get; set; }
    public string? Lote { get; set; }
    public decimal? ValorUnitarioAquisicao { get; set; }
    public decimal? Quantidade { get; set; }
    public byte? UnidadeMedida { get; set; }
    public uint? IdPessoa { get; set; }
}