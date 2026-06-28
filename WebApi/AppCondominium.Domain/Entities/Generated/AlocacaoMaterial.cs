namespace AppCondominium.Domain.Entities;

public class AlocacaoMaterial
{
    public uint? IdAlocacaoMaterial { get; set; }
    public uint? IdCondominio { get; set; }
    public uint? IdMaterial { get; set; }
    public uint? IdPessoa { get; set; }
    public uint? IdLocal { get; set; }
    public DateTime? DataHoraInicio { get; set; }
    public DateTime? DataHoraFim { get; set; }
}