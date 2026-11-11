using AppCondominium.Domain.Entities;

namespace AppCondominium.Application.Interfaces;

public interface ITenantAccessService
{
    Task<bool> UsuarioTemAcessoAsync(uint idPessoa, uint idCondominio, CancellationToken ct = default);
    Task<IReadOnlyList<Condominio>> ListarCondominiosAutorizadosAsync(uint idPessoa, string? filtroNome, CancellationToken ct = default);
    Task<uint?> ResolverIdPessoaPorEmailAsync(string email, CancellationToken ct = default);
}
