using AppCondominium.Application.Authorization;

namespace AppCondominium.Application.Interfaces;

/// <summary>
/// Resolve permissões da pessoa no condomínio informado. Administrador tem acesso total só nesse tenant.
/// </summary>
public interface IPermissionResolver
{
    Task<bool> HasAsync(uint idPessoa, uint idCondominio, string permissionKey, string acao, CancellationToken ct = default);

    Task<PermissionSnapshot> SnapshotAsync(uint idPessoa, uint idCondominio, CancellationToken ct = default);

    Task<IReadOnlyList<PermissaoLinha>> MatrizPerfilAsync(uint idPerfil, CancellationToken ct = default);

    Task SaveMatrizPerfilAsync(uint idPerfil, IReadOnlyList<PermissaoLinha> linhas, CancellationToken ct = default);

    Task<IReadOnlyList<PermissaoLinha>> ExcecoesAsync(uint idPessoa, uint idCondominio, CancellationToken ct = default);

    Task SaveExcecoesAsync(uint idPessoa, uint idCondominio, IReadOnlyList<PermissaoLinha> linhas, CancellationToken ct = default);
}
