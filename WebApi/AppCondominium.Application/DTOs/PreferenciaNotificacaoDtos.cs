namespace AppCondominium.Application.DTOs;

public record PreferenciaNotificacaoItemDto(
    string CodigoTipo,
    string Descricao,
    string Modulo,
    int Ordem,
    bool Obrigatoria,
    bool PushDisponivel,
    bool EmailDisponivel,
    bool AtivoPush,
    bool AtivoEmail);

public record PreferenciaNotificacaoListaDto(IReadOnlyList<PreferenciaNotificacaoItemDto> Categorias);

public record PreferenciaNotificacaoAtualizacaoDto(string CodigoTipo, bool AtivoPush, bool AtivoEmail);

public record PreferenciaNotificacaoSalvarRequest(IReadOnlyList<PreferenciaNotificacaoAtualizacaoDto> Preferencias);