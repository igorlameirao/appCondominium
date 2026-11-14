using AppCondominium.Domain.Entities;

namespace AppCondominium.Application.Interfaces;

public interface IPessoaVinculoService
{
    Task ValidarAntesGravarAsync(PessoaVinculo entity, bool inclusao, CancellationToken ct = default);
    Task AplicarAjustesAposGravarAsync(PessoaVinculo entity, CancellationToken ct = default);
}