using AppCondominium.Application.DTOs;

namespace AppCondominium.Application.Interfaces;

public interface IPessoaCadastroService
{
    Task<PessoaFisicaIntegradaResponse> CriarOuAtualizarPessoaFisicaAsync(
        PessoaFisicaIntegradaRequest request, uint? idPessoa, CancellationToken ct = default,
        PessoaCadastroModo modo = PessoaCadastroModo.Completo);

    Task<PessoaJuridicaIntegradaResponse> CriarOuAtualizarPessoaJuridicaAsync(
        PessoaJuridicaIntegradaRequest request, uint? idPessoa, CancellationToken ct = default,
        PessoaCadastroModo modo = PessoaCadastroModo.Completo);

    Task<PessoaFisicaIntegradaResponse?> ObterPessoaFisicaIntegradaAsync(uint idPessoa, CancellationToken ct = default);
    Task<PessoaJuridicaIntegradaResponse?> ObterPessoaJuridicaIntegradaAsync(uint idPessoa, CancellationToken ct = default);
}