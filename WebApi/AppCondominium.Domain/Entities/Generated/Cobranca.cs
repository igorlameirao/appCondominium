namespace AppCondominium.Domain.Entities;

public class Cobranca
{
    public ulong? IdCobranca { get; set; }
    public uint? IdCondominio { get; set; }
    public uint? IdArquivoCobrancaRetorno { get; set; }
    public uint? SequencialRegistroRetorno { get; set; }
    public uint? IdArquivoCobrancaRemessa { get; set; }
    public uint? SequencialRegistroRemessa { get; set; }
    public uint? IdUnidade { get; set; }
    public DateOnly? DataGeracao { get; set; }
    public DateOnly? DataVencimento { get; set; }
}