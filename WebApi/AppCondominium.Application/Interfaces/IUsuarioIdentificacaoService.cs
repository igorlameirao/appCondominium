using AppCondominium.Domain.Entities;

namespace AppCondominium.Application.Interfaces;

public interface IUsuarioIdentificacaoService
{
    /// <summary>Localiza pessoa física por e-mail normalizado ou CPF (com ou sem máscara).</summary>
    Task<Pessoafisica?> ResolverPessoafisicaPorUsuarioAsync(string usuario, CancellationToken ct = default);

    Task<uint?> ResolverIdPessoaPorUsuarioAsync(string usuario, CancellationToken ct = default);
}