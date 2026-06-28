namespace AppCondominium.Domain.Entities;

public class Local
{
    public uint? IdLocal { get; set; }
    public uint? IdCondominio { get; set; }
    public string? Descricao { get; set; }
    public uint? IdLocalPai { get; set; }
    public byte? TipoLocal { get; set; }
}