namespace AppCondominium.Domain.Entities;

public class ConfiguracaoCondominio
{
    public uint? IdConfiguracao { get; set; }
    public uint? IdCondominio { get; set; }
    public string? CorPadrao { get; set; }
    public int? RetencaoHistoricoEncomendasMeses { get; set; }
    public int? RetencaoFotosEncomendasMeses { get; set; }
}