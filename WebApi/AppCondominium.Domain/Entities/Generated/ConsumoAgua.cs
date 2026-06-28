namespace AppCondominium.Domain.Entities;

public class ConsumoAgua
{
    public uint? IdConsumo { get; set; }
    public uint? IdCondominio { get; set; }
    public uint? IdUnidade { get; set; }
    public uint? IdHidrometro { get; set; }
    public DateTime? DataLeitura { get; set; }
    public uint? LeituraHidrometro { get; set; }
    public uint? Consumo { get; set; }
    public string? MesReferencia { get; set; }
}