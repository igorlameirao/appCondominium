namespace AppCondominium.Domain.Entities;

public class Equipamento
{
    public uint? IdEquipamento { get; set; }
    public uint? IdCondominio { get; set; }
    public string? Descricao { get; set; }
    public decimal? ValorAluguel { get; set; }
    public uint? DuracaoHoras { get; set; }
}