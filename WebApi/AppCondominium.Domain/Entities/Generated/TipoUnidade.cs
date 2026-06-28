namespace AppCondominium.Domain.Entities;

public class TipoUnidade
{
    public uint? IdTipoUnidade { get; set; }
    public uint? IdCondominio { get; set; }
    public string? Descricao { get; set; }
    public uint? QtdSalas { get; set; }
    public uint? QtdQuartos { get; set; }
    public uint? QtdSuites { get; set; }
    public uint? QtdBanheiros { get; set; }
    public decimal? Area { get; set; }
}