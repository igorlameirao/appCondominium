namespace AppCondominium.Domain.Entities;

public class PermissionKey
{
    public uint IdPermissionKey { get; set; }
    public string Chave { get; set; } = "";
    public string Nome { get; set; } = "";
    public string Modulo { get; set; } = "";
}
