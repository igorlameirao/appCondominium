namespace AppCondominium.Domain.Entities;

public class ConviteAcesso
{
    public uint? IdConvite { get; set; }
    public uint? IdCondominio { get; set; }
    public uint? IdPessoaDestinatario { get; set; }
    public string? EmailDestinatario { get; set; }
    public string? CpfDestinatario { get; set; }
    public byte? TipoConvite { get; set; }
    public uint? CodigoPapelVinculo { get; set; }
    public uint? IdPerfil { get; set; }
    public uint? IdUnidade { get; set; }
    public uint? IdPessoaRelacionada { get; set; }
    public string? TokenHash { get; set; }
    public DateTime? DataEmissao { get; set; }
    public DateTime? DataExpiracao { get; set; }
    public byte? Estado { get; set; }
    public uint? IdPessoaEmissor { get; set; }
    public DateTime? DataAceite { get; set; }
    public uint? IdVinculoCriado { get; set; }
    public uint? IdConviteAnterior { get; set; }
    public byte? EstadoEnvioEmail { get; set; }
    public uint? TentativasEnvioEmail { get; set; }
    public long? IdEmailQueue { get; set; }
    public string? UltimoErroEnvio { get; set; }
    public string? Observacao { get; set; }
}