using AppCondominium.Application.DTOs;

namespace AppCondominium.Application.Interfaces;

public interface IFornecedorCadastroService
{
  Task<FornecedorIntegradoResponse> CadastrarAsync(FornecedorIntegradoRequest request, CancellationToken ct = default);
  Task<FornecedorIntegradoResponse> AtualizarAsync(uint idFornecedor, FornecedorIntegradoRequest request, CancellationToken ct = default);
  Task<FornecedorIntegradoRequest?> ObterParaEdicaoAsync(uint idFornecedor, CancellationToken ct = default);
}