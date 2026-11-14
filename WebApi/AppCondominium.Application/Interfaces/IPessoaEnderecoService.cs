using AppCondominium.Application.DTOs;

namespace AppCondominium.Application.Interfaces;

public interface IPessoaEnderecoService
{
    Task<IReadOnlyList<PessoaEnderecoItemDto>> ListarPorPessoaAsync(uint idPessoa, CancellationToken ct = default);
    Task<PessoaEnderecoItemDto> GravarAsync(uint idPessoa, PessoaEnderecoUpsertRequest request, CancellationToken ct = default);
    Task RemoverAsync(uint idPessoa, uint idEndereco, CancellationToken ct = default);
}