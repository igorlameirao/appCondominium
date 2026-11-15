using AppCondominium.Application.Convites;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AppCondominium.Infrastructure.Services.Email;

public sealed class EmailService : IEmailService
{
    public const int MaxTentativas = 5;
    public const string ErroSenhaIlegivel =
        "A senha SMTP cadastrada não pôde ser lida. Abra Configuração SMTP, informe a senha novamente e clique em Salvar.";
    public const string ErroConfigAusente =
        "Nenhuma configuração de e-mail cadastrada. Acesse Configuração SMTP e salve o servidor.";

    private readonly AppDbContext _db;
    private readonly IConfiguracaoEmailService _configService;
    private readonly IEmailProviderFactory _providerFactory;
    private readonly IConfiguration _configuration;
    private readonly IEmailQueuePump _queuePump;
    private readonly ILogger<EmailService> _logger;

    public EmailService(
        AppDbContext db,
        IConfiguracaoEmailService configService,
        IEmailProviderFactory providerFactory,
        IConfiguration configuration,
        IEmailQueuePump queuePump,
        ILogger<EmailService> logger)
    {
        _db = db;
        _configService = configService;
        _providerFactory = providerFactory;
        _configuration = configuration;
        _queuePump = queuePump;
        _logger = logger;
    }

    public Task<long> EnfileirarAsync(string destinatario, string assunto, string corpo, bool html = false, CancellationToken ct = default)
        => EnfileirarCoreAsync(destinatario, assunto, corpo, html, ct, pulse: true, reservarEnvio: false);

    public Task<int> ProcessarFilaAsync(int maxItens = 20, CancellationToken ct = default)
        => ProcessarFilaCoreAsync(maxItens, null, ct);

    public Task<int> ProcessarFilaPorIdsAsync(IReadOnlyCollection<long> ids, CancellationToken ct = default)
    {
        if (ids == null || ids.Count == 0) return Task.FromResult(0);
        return ProcessarFilaCoreAsync(ids.Count, ids, ct);
    }

    private async Task<int> ProcessarFilaCoreAsync(int maxItens, IReadOnlyCollection<long>? apenasIds, CancellationToken ct)
    {
        var staleAntes = DateTime.UtcNow.AddSeconds(-90);
        IQueryable<EmailQueue> query;
        if (apenasIds is { Count: > 0 })
        {
            query = _db.EmailQueues.Where(e =>
                apenasIds.Contains(e.Id) && e.Status != EmailQueueStatus.Enviado);
        }
        else
        {
            query = _db.EmailQueues.Where(e =>
                e.Status == EmailQueueStatus.Pendente
                || (e.Status == EmailQueueStatus.Erro && e.Tentativas < MaxTentativas)
                || (e.Status == EmailQueueStatus.Enviando
                    && e.Tentativas < MaxTentativas
                    && (e.UltimaTentativa == null || e.UltimaTentativa < staleAntes)));
        }

        var itens = await query
            .OrderBy(e => e.Status == EmailQueueStatus.Pendente ? 0 : 1)
            .ThenBy(e => e.DataCriacao)
            .Take(Math.Clamp(maxItens, 1, 100))
            .ToListAsync(ct);

        if (itens.Count == 0) return 0;

        var (cfg, senha) = await _configService.ObterAtivaComSenhaAsync(ct);
        if (cfg != null && cfg.Ativo)
        {
            if (string.IsNullOrEmpty(senha))
                senha = _configuration["Smtp:Password"];
            if (!string.IsNullOrEmpty(senha) && !string.IsNullOrWhiteSpace(cfg.ServidorSmtp))
                return await EnviarItensAsync(itens, cfg, senha, ct);

            return await MarcarErroFilaAsync(itens, ErroSenhaIlegivel, ct);
        }

        return await ProcessarComFallbackAppsettingsAsync(itens, ct);
    }

    private async Task<int> EnviarItensAsync(List<EmailQueue> itens, ConfiguracaoEmail cfg, string senha, CancellationToken ct)
    {
        var agora = DateTime.UtcNow;
        foreach (var item in itens)
        {
            item.Status = EmailQueueStatus.Enviando;
            item.UltimaTentativa = agora;
            item.Tentativas++;
        }
        await _db.SaveChangesAsync(ct);
        await _db.Database.CloseConnectionAsync();

        try
        {
            var provider = _providerFactory.Resolve(cfg.Provedor);
            var lote = itens.Select(i => (i.Destinatario, i.Assunto, i.Corpo, i.CorpoHtml)).ToList();
            var resultados = await provider.EnviarVariosAsync(cfg, senha, lote, ct);

            var enviados = 0;
            for (var i = 0; i < itens.Count; i++)
            {
                var item = itens[i];
                var (ok, msg, _) = i < resultados.Count ? resultados[i] : (false, "Falha ao enviar.", (string?)null);
                if (ok)
                {
                    item.Status = EmailQueueStatus.Enviado;
                    item.DataEnvio = DateTime.UtcNow;
                    item.MensagemErro = null;
                    enviados++;
                }
                else
                {
                    item.Status = EmailQueueStatus.Erro;
                    item.MensagemErro = Truncate(msg, 2000);
                    _logger.LogWarning("Falha e-mail fila Id={Id} tentativa={Tentativa}", item.Id, item.Tentativas);
                }
            }
            await _db.SaveChangesAsync(ct);
            return enviados;
        }
        catch (Exception ex)
        {
            foreach (var item in itens)
            {
                if (item.Status != EmailQueueStatus.Enviado)
                {
                    item.Status = EmailQueueStatus.Erro;
                    item.MensagemErro = Truncate(ex.Message, 2000);
                }
            }
            try { await _db.SaveChangesAsync(CancellationToken.None); }
            catch (Exception saveEx)
            {
                _logger.LogError(saveEx, "Falha ao gravar status de erro da fila de e-mail.");
            }
            throw;
        }
    }

    private async Task<long> EnfileirarCoreAsync(
        string destinatario, string assunto, string corpo, bool html, CancellationToken ct,
        bool pulse, bool reservarEnvio)
    {
        var dest = (destinatario ?? "").Trim();
        if (string.IsNullOrEmpty(dest))
        {
            _logger.LogWarning("E-mail ignorado: destinatário vazio.");
            return 0;
        }

        var row = new EmailQueue
        {
            Destinatario = dest,
            Assunto = (assunto ?? "").Trim(),
            Corpo = corpo ?? "",
            CorpoHtml = html,
            Status = reservarEnvio ? EmailQueueStatus.Enviando : EmailQueueStatus.Pendente,
            UltimaTentativa = reservarEnvio ? DateTime.UtcNow : null,
            DataCriacao = DateTime.UtcNow
        };
        _db.EmailQueues.Add(row);
        await _db.SaveChangesAsync(ct);
        if (pulse)
            ThreadPool.QueueUserWorkItem(static pump => ((IEmailQueuePump)pump!).Pulse(), _queuePump);
        return row.Id;
    }

    private async Task<int> ProcessarComFallbackAppsettingsAsync(List<EmailQueue> itens, CancellationToken ct)
    {
        var smtp = _configuration.GetSection(SmtpOptions.SectionName);
        var host = smtp["Host"];
        if (string.IsNullOrWhiteSpace(host))
            return await MarcarErroFilaAsync(itens, ErroConfigAusente, ct);

        var cfg = new ConfiguracaoEmail
        {
            Provedor = EmailProvedorCodes.SmtpGenerico,
            ServidorSmtp = host,
            Porta = int.TryParse(smtp["Port"], out var p) ? p : 587,
            Ssl = bool.TryParse(smtp["UseSsl"], out var ssl) && ssl,
            StartTls = (int.TryParse(smtp["Port"], out var p2) ? p2 : 587) == 587,
            TimeoutSegundos = 30,
            UsuarioSmtp = smtp["Usuario"] ?? smtp["User"] ?? "",
            NomeRemetente = smtp["RemetenteNome"] ?? "AppCondominium",
            EmailRemetente = smtp["RemetenteEmail"] ?? smtp["From"] ?? smtp["Usuario"] ?? "",
            Ativo = bool.TryParse(smtp["Habilitado"], out var hab) && hab
        };
        var senha = smtp["Senha"] ?? smtp["Password"] ?? "";
        if (string.IsNullOrWhiteSpace(cfg.EmailRemetente) || !cfg.Ativo)
            return await MarcarErroFilaAsync(itens, ErroConfigAusente, ct);

        return await EnviarItensAsync(itens, cfg, senha, ct);
    }

    private async Task<int> MarcarErroFilaAsync(List<EmailQueue> itens, string mensagem, CancellationToken ct)
    {
        var agora = DateTime.UtcNow;
        foreach (var item in itens)
        {
            item.Tentativas++;
            item.UltimaTentativa = agora;
            item.Status = EmailQueueStatus.Erro;
            item.MensagemErro = Truncate(mensagem, 2000);
        }
        await _db.SaveChangesAsync(ct);
        return 0;
    }

    private static string Truncate(string? s, int max) =>
        string.IsNullOrEmpty(s) ? "" : (s.Length <= max ? s : s[..max]);
}