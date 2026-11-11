namespace AppCondominium.Application.Authorization;

public record PermissionSnapshot(bool AcessoTotal, string Perfil, IReadOnlyList<string> Permissoes);

public record PermissaoLinha(
    string PermissionKey,
    string DisplayName,
    string Modulo,
    bool Visualizar,
    bool Incluir,
    bool Alterar,
    bool Excluir);
