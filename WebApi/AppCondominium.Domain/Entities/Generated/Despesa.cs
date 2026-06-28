namespace AppCondominium.Domain.Entities;

public class Despesa
{
    public ulong? IdDespesa { get; set; }
    public uint? IdFornecedor { get; set; }
    public uint? IdCondominio { get; set; }
    public uint? IdConcorrencia { get; set; }
    public uint? IdTipoDespesa { get; set; }
    public DateOnly? DataDespesa { get; set; }
    public string? Descricao { get; set; }
    public DateTime? DataLancamento { get; set; }
    public decimal? Valor { get; set; }
    public string? Observacoes { get; set; }
}