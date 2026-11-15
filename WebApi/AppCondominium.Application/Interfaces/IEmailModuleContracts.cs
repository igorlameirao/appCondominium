using AppCondominium.Application.Common;
using AppCondominium.Application.DTOs;
using AppCondominium.Domain.Entities;

namespace AppCondominium.Application.Interfaces;

public interface ISmtpSecretProtector
{
    string Protect(string plainText);
    string Unprotect(string protectedText);
}

public interface IEmailProvider
{
    string CodigoProvedor { get; }
    Task<(bool ok, string mensagem)> TestarConexaoAsync(ConfiguracaoEmail cfg, string senhaPlain, CancellationToken ct = default);
    Task<(bool ok, string mensagem, string? exceptionDetail)> EnviarAsync(
        ConfiguracaoEmail cfg,
        string senhaPlain,
        string destinatario,
        string assunto,
        string corpo,
        bool html = false,
        CancellationToken ct = default);
    Task<IReadOnlyList<(bool ok, string mensagem, string? exceptionDetail)>> EnviarVariosAsync(
        ConfiguracaoEmail cfg,
        string senhaPlain,
        IReadOnlyList<(string Destinatario, string Assunto, string Corpo, bool Html)> mensagens,
        CancellationToken ct = default);
}

public interface IEmailProviderFactory
{
    IEmailProvider Resolve(string provedorCodigo);
}

public interface IConfiguracaoEmailService
{
    Task<ConfiguracaoEmailDto?> ObterAsync(CancellationToken ct = default);
    Task<ConfiguracaoEmailDto> SalvarAsync(ConfiguracaoEmailUpsertDto dto, CancellationToken ct = default);
    Task<EmailTesteConexaoResultadoDto> TestarConexaoAsync(CancellationToken ct = default);
    Task<EmailTesteEnvioResultadoDto> EnviarTesteAsync(EmailTesteEnvioRequestDto dto, CancellationToken ct = default);
    Task<(ConfiguracaoEmail? cfg, string? senhaPlain)> ObterAtivaComSenhaAsync(CancellationToken ct = default);
}

public interface IEmailService
{
    Task<long> EnfileirarAsync(string destinatario, string assunto, string corpo, bool html = false, CancellationToken ct = default);
    Task<int> ProcessarFilaAsync(int maxItens = 20, CancellationToken ct = default);
    Task<int> ProcessarFilaPorIdsAsync(IReadOnlyCollection<long> ids, CancellationToken ct = default);
}

public interface IEmailQueuePump
{
    void Pulse();
    Task WaitAsync(CancellationToken cancellationToken);
}

public interface IEmailQueueConsultaService
{
    Task<PagedResult<EmailQueueListItemDto>> SearchPagedAsync(
        int page, int pageSize, EmailQueueFiltroDto filtro, CancellationToken ct = default);
    Task<EmailQueueDetalheDto?> GetByIdAsync(long id, CancellationToken ct = default);
    Task<EmailQueueReprocessarResultadoDto> ReprocessarAsync(long id, CancellationToken ct = default);
    Task<EmailQueueReprocessarResultadoDto> ResetarTentativasAsync(long id, CancellationToken ct = default);
}