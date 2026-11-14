namespace AppCondominium.Domain.Entities;

public class AutorizacaoAcessoTemporario
{
    public uint? IdAutorizacao { get; set; }
    public uint? IdCondominio { get; set; }
    public uint? IdUnidade { get; set; }
    public uint? IdPessoaVisitante { get; set; }
    public string? NomeVisitante { get; set; }
    public string? DocumentoVisitante { get; set; }
    public uint? IdPessoaAutorizador { get; set; }
    public DateTime? DataHoraInicio { get; set; }
    public DateTime? DataHoraFim { get; set; }
    public byte? TipoAcesso { get; set; }
    public string? Motivo { get; set; }
}