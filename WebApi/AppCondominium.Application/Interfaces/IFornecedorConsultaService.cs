using AppCondominium.Application.Common;
using AppCondominium.Application.DTOs;

namespace AppCondominium.Application.Interfaces;

public interface IFornecedorConsultaService
{
    Task<PagedResult<FornecedorListagemItemDto>> ListarAsync(int page, int pageSize, string? filter, CancellationToken ct = default);
}