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
    /// O vínculo PessoaCondominio guarda um perfil; ocupar uma unidade acrescenta Morador quando esse não é o perfil já cadastrado.
    /// </summary>
    Task<IReadOnlyList<CondominioVinculo>> ListarVinculosAsync(uint idPessoa, CancellationToken ct = default);

    Task<bool> UsuarioTemPerfilAsync(uint idPessoa, uint idCondominio, uint idPerfil, CancellationToken ct = default);
    Task<uint?> ResolverIdPessoaPorEmailAsync(string email, CancellationToken ct = default);
}
