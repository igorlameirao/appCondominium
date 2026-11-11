namespace AppCondominium.Domain.Entities;

public class PerfilPermissao
{
    public uint IdPerfil { get; set; }
    public uint IdPermissionKey { get; set; }
    public bool Visualizar { get; set; }
    public bool Incluir { get; set; }
    public bool Alterar { get; set; }
    public bool Excluir { get; set; }
}
