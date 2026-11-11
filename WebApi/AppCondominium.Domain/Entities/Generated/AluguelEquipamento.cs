namespace AppCondominium.Domain.Entities;

public class AluguelEquipamento
{
    public uint? IdAluguelEquipamento { get; set; }
    public uint? IdUnidade { get; set; }
    public uint? IdEquipamento { get; set; }
    public uint? IdCondominio { get; set; }
    public DateTime? DataInicio { get; set; }
    public DateTime? DataFim { get; set; }
    public decimal? Valor { get; set; }
}