using AppCondominium.Application.DTOs;

namespace AppCondominium.Application.Interfaces;

public interface IPessoaContextoInclusaoService
{
    Task<PessoaContextoGravacaoResponse> GravarAsync(PessoaContextoGravacaoRequest request, uint? idPessoa, CancellationToken ct = default);
}

public interface IColaboradorService
{
    Task<ColaboradorConsultaDto> ConsultarAsync(uint idPessoa, CancellationToken ct = default);
    Task<uint> GravarAsync(uint idPessoa, PessoaContextoGravacaoRequest request, byte tipoColaborador, bool arquivoObrigatorioSeNovo, CancellationToken ct = default);
}
