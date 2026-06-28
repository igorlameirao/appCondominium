namespace AppCondominium.Domain.Entities;

public class GuardaEncomenda
{
    public ulong? IdGuardaEncomenda { get; set; }
    public uint? IdCondominio { get; set; }
    public uint? IdUnidade { get; set; }
    public string? CodigoEncomenda { get; set; }
    public uint? IdLocal { get; set; }
    public DateTime? DataHoraEntrada { get; set; }
    public DateTime? DataHoraSaida { get; set; }
    public uint? IdPessoaEntrada { get; set; }
    public uint? IdPessoaSaida { get; set; }
}