namespace AppCondominium.Domain.Entities;

public class Concorrencia
{
    public uint? IdConcorrencia { get; set; }
    public uint? IdCondominio { get; set; }
    public uint? IdTipoDespesa { get; set; }
    public string? Descricao { get; set; }
    public byte? TipoConcorrencia { get; set; }
    public byte? Fase { get; set; }
    public DateTime? DataAbertura { get; set; }
    public DateTime? DataPrevistaEncerramento { get; set; }
    public DateTime? DataEncerramento { get; set; }
}