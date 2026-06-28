namespace AppCondominium.Domain.Entities;

public class Hidrometro
{
    public uint? IdHidrometro { get; set; }
    public uint? IdCondominio { get; set; }
    public uint? IdUnidade { get; set; }
    public string? NumeroSerie { get; set; }
}