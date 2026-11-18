using AppCondominium.Application.DTOs;
using AppCondominium.Domain.Notificacoes;

namespace AppCondominium.Application.Interfaces;

public interface IPreferenciaNotificacaoService
{
    Task<IReadOnlyList<PreferenciaNotificacaoItemDto>> ListarAsync(uint idPessoa, CancellationToken ct = default);

    Task<IReadOnlyList<PreferenciaNotificacaoItemDto>> SalvarAsync(
        uint idPessoa,
        IReadOnlyList<PreferenciaNotificacaoAtualizacaoDto> preferencias,
        CancellationToken ct = default);

    /// <summary>Consulta se o canal está habilitado para envio (uso futuro pelos módulos).</summary>
    Task<bool> CanalAtivoAsync(uint idPessoa, string codigoTipo, NotificacaoCanal canal, CancellationToken ct = default);
}