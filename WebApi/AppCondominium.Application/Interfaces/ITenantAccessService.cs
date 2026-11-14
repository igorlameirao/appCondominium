using AppCondominium.Domain.Entities;

namespace AppCondominium.Application.Interfaces;

public record PerfilVinculo(uint IdPerfil, string Nome);

public record CondominioVinculo(uint IdCondominio, string Nome, IReadOnlyList<PerfilVinculo> Perfis, string? Dominio = null);

public interface ITenantAccessService
{
    Task<bool> UsuarioTemAcessoAsync(uint idPessoa, uint idCondominio, CancellationToken ct = default);
    Task<IReadOnlyList<Condominio>> ListarCondominiosAutorizadosAsync(uint idPessoa, string? filtroNome, CancellationToken ct = default);

    /// <summary>
    /// Condomínios do usuário e os perfis com que ele pode entrar em cada um.
    /// PessoaVinculo.IdPerfil guarda o RBAC explícito; vínculo por unidade pode acrescentar perfil Morador na lista de escolha (RN-Gerais 17).
    /// </summary>
    Task<IReadOnlyList<CondominioVinculo>> ListarVinculosAsync(uint idPessoa, CancellationToken ct = default);

    Task<bool> UsuarioTemPerfilAsync(uint idPessoa, uint idCondominio, uint idPerfil, CancellationToken ct = default);
    Task<uint?> ResolverIdPessoaPorEmailAsync(string email, CancellationToken ct = default);
}
