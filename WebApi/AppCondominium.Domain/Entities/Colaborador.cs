namespace AppCondominium.Domain.Entities;

public class Colaborador
{
    public uint? IdColaborador { get; set; }
    public uint? IdPessoa { get; set; }
    public uint? IdCondominio { get; set; }
    public DateOnly? DataAdmissao { get; set; }
    public DateOnly? DataDesligamento { get; set; }
    public string? CTPS { get; set; }
    public byte? TipoColaborador { get; set; }
    public uint? IdFuncaoColaborador { get; set; }
}
