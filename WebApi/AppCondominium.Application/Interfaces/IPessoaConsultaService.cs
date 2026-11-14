using AppCondominium.Application.Common;
using AppCondominium.Application.DTOs;

namespace AppCondominium.Application.Interfaces;

public interface IPessoaConsultaService
{
    Task<PagedResult<PessoaListagemItemDto>> ListarAsync(
        int page, int pageSize, string? filter, string? tipo, string? situacao, CancellationToken ct = default);

    Task<PessoaPorDocumentoDto?> ObterPorDocumentoAsync(string cpfcnpj, bool permitirCadastroGlobal, CancellationToken ct = default);
}