namespace AppCondominium.Domain.Entities;

public class OfertaConcorrencia
{
    public uint? IdOfertaConcorrencia { get; set; }
    public uint? IdFornecedor { get; set; }
    public uint? IdCondominio { get; set; }
    public uint? IdConcorrencia { get; set; }
    public string? Descricao { get; set; }
    public byte[]? DocumentoComprobatorio { get; set; }
    public decimal? Preco { get; set; }
    public DateOnly? DataOferta { get; set; }
    public DateOnly? DataValidade { get; set; }
    public byte? Vencedora { get; set; }
    public string? Justificativa { get; set; }
    public byte? Desistente { get; set; }
}