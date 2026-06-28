namespace AppCondominium.Domain.Entities;

public class Unidade
{
    public uint? IdUnidade { get; set; }
    public uint? IdCondominio { get; set; }
    public uint? IdBloco { get; set; }
    public uint? Numero { get; set; }
    public uint? IdTipoUnidade { get; set; }
    public uint? IdHidrometro { get; set; }
}