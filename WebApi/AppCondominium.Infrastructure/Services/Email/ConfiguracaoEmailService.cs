using System.Diagnostics;
using System.Net.Mail;
using AppCondominium.Application.DTOs;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;
using AppCondominium.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AppCondominium.Infrastructure.Services.Email;

public sealed class ConfiguracaoEmailService : IConfiguracaoEmailService
{
    private readonly AppDbContext _db;
    private readonly ISmtpSecretProtector _protector;
    private readonly IEmailProviderFactory _providerFactory;
    private readonly ILogger<ConfiguracaoEmailService> _logger;

    public ConfiguracaoEmailService(
        AppDbContext db,
        ISmtpSecretProtector protector,
        IEmailProviderFactory providerFactory,
        ILogger<ConfiguracaoEmailService> logger)
    {
        _db = db;
        _protector = protector;
        _providerFactory = providerFactory;
        _logger = logger;
    }

    public async Task<ConfiguracaoEmailDto?> ObterAsync(CancellationToken ct = default)
    {
        var entity = await _db.ConfiguracoesEmail.AsNoTracking()
            .OrderByDescending(e => e.Ativo).ThenBy(e => e.Id)
            .FirstOrDefaultAsync(ct);
        return entity == null ? null : ToDto(entity);
    }

    public async Task<ConfiguracaoEmailDto> SalvarAsync(ConfiguracaoEmailUpsertDto dto, CancellationToken ct = default)
    {
        Validate(dto);
        var entity = await _db.ConfiguracoesEmail.OrderBy(e => e.Id).FirstOrDefaultAsync(ct);
        var novaSenha = (dto.Senha ?? "").Trim();

        if (entity == null)
        {
            if (string.IsNullOrEmpty(novaSenha))
                throw new InvalidOperationException("Senha é obrigatória no primeiro cadastro.");
            entity = new ConfiguracaoEmail
            {
                DataCadastro = DateTime.UtcNow,
                SenhaCriptografada = _protector.Protect(novaSenha)
            };
            _db.ConfiguracoesEmail.Add(entity);
        }
        else if (!string.IsNullOrEmpty(novaSenha))
            entity.SenhaCriptografada = _protector.Protect(novaSenha);
        else if (string.IsNullOrWhiteSpace(entity.SenhaCriptografada))
            throw new InvalidOperationException("Senha é obrigatória.");

        entity.Provedor = NormalizeProvedor(dto.Provedor);
        entity.ServidorSmtp = dto.ServidorSmtp.Trim();
        entity.Porta = dto.Porta;
        entity.Ssl = dto.Ssl;
        entity.StartTls = dto.StartTls;
        entity.TimeoutSegundos = dto.TimeoutSegundos <= 0 ? 30 : dto.TimeoutSegundos;
        entity.UsuarioSmtp = dto.UsuarioSmtp.Trim();
        entity.NomeRemetente = dto.NomeRemetente.Trim();
        entity.EmailRemetente = dto.EmailRemetente.Trim();
        entity.ReplyTo = string.IsNullOrWhiteSpace(dto.ReplyTo) ? null : dto.ReplyTo.Trim();
        entity.Ativo = dto.Ativo;
        entity.DataAtualizacao = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Configuração SMTP salva (Id={Id}).", entity.Id);
        return ToDto(entity);
    }

    public async Task<EmailTesteConexaoResultadoDto> TestarConexaoAsync(CancellationToken ct = default)
    {
        var sw = Stopwatch.StartNew();
        var (cfg, senha) = await ObterAtivaComSenhaAsync(ct);
        if (cfg == null || string.IsNullOrEmpty(senha))
        {
            sw.Stop();
            return new EmailTesteConexaoResultadoDto
            {
                Sucesso = false,
                Mensagem = MensagemConfigIndisponivel(cfg),
                DuracaoMs = (int)sw.ElapsedMilliseconds
            };
        }

        var provider = _providerFactory.Resolve(cfg.Provedor);
        var (ok, msg) = await provider.TestarConexaoAsync(cfg, senha, ct);
        sw.Stop();
        return new EmailTesteConexaoResultadoDto { Sucesso = ok, Mensagem = msg, DuracaoMs = (int)sw.ElapsedMilliseconds };
    }

    public async Task<EmailTesteEnvioResultadoDto> EnviarTesteAsync(EmailTesteEnvioRequestDto dto, CancellationToken ct = default)
    {
        var sw = Stopwatch.StartNew();
        var dest = (dto.Destinatario ?? "").Trim();
        const string assuntoTeste = "AppCondominium — E-mail de teste";
        if (string.IsNullOrEmpty(dest) || !IsValidEmail(dest))
        {
            sw.Stop();
            return BuildTeste(false, "Informe um endereço de destino válido.", dest, assuntoTeste, null, (int)sw.ElapsedMilliseconds);
        }

        var (cfg, senha) = await ObterAtivaComSenhaAsync(ct);
        if (cfg == null || string.IsNullOrEmpty(senha))
        {
            sw.Stop();
            return BuildTeste(false, MensagemConfigIndisponivel(cfg), dest, assuntoTeste, cfg, (int)sw.ElapsedMilliseconds);
        }

        var corpo = "E-mail de teste do AppCondominium.\n\nSe você recebeu esta mensagem, o SMTP está configurado corretamente.";
        var provider = _providerFactory.Resolve(cfg.Provedor);
        var (ok, msg, _) = await provider.EnviarAsync(cfg, senha, dest, assuntoTeste, corpo, false, ct);
        sw.Stop();
        return BuildTeste(ok, ok ? "E-mail de teste enviado com sucesso." : msg, dest, assuntoTeste, cfg, (int)sw.ElapsedMilliseconds);
    }

    public async Task<(ConfiguracaoEmail? cfg, string? senhaPlain)> ObterAtivaComSenhaAsync(CancellationToken ct = default)
    {
        var entity = await _db.ConfiguracoesEmail.AsNoTracking()
            .Where(e => e.Ativo).OrderBy(e => e.Id).FirstOrDefaultAsync(ct)
            ?? await _db.ConfiguracoesEmail.AsNoTracking().OrderBy(e => e.Id).FirstOrDefaultAsync(ct);

        if (entity == null) return (null, null);
        try
        {
            var senha = _protector.Unprotect(entity.SenhaCriptografada);
            if (!string.IsNullOrEmpty(senha)
                && !entity.SenhaCriptografada.StartsWith(SmtpSecretProtector.PayloadPrefix, StringComparison.Ordinal))
            {
                await TryMigrarPayloadAsync(entity.Id, senha, ct);
            }
            return (entity, senha);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Não foi possível descriptografar a senha SMTP (Id={Id}).", entity.Id);
            return (entity, null);
        }
    }

    private async Task TryMigrarPayloadAsync(int id, string senhaPlain, CancellationToken ct)
    {
        try
        {
            var tracked = await _db.ConfiguracoesEmail.FirstOrDefaultAsync(e => e.Id == id, ct);
            if (tracked == null
                || tracked.SenhaCriptografada.StartsWith(SmtpSecretProtector.PayloadPrefix, StringComparison.Ordinal))
                return;
            tracked.SenhaCriptografada = _protector.Protect(senhaPlain);
            tracked.DataAtualizacao = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Não foi possível migrar senha SMTP (Id={Id}).", id);
        }
    }

    private ConfiguracaoEmailDto ToDto(ConfiguracaoEmail e)
    {
        var senhaGravada = !string.IsNullOrWhiteSpace(e.SenhaCriptografada);
        var senhaLegivel = false;
        if (senhaGravada)
        {
            try { senhaLegivel = !string.IsNullOrEmpty(_protector.Unprotect(e.SenhaCriptografada)); }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Senha SMTP não legível (Id={Id}).", e.Id);
            }
        }

        return new ConfiguracaoEmailDto
        {
            Id = e.Id,
            Provedor = e.Provedor,
            ServidorSmtp = e.ServidorSmtp,
            Porta = e.Porta,
            Ssl = e.Ssl,
            StartTls = e.StartTls,
            TimeoutSegundos = e.TimeoutSegundos,
            UsuarioSmtp = e.UsuarioSmtp,
            SenhaConfigurada = senhaGravada,
            SenhaRequerAtualizacao = senhaGravada && !senhaLegivel,
            NomeRemetente = e.NomeRemetente,
            EmailRemetente = e.EmailRemetente,
            ReplyTo = e.ReplyTo,
            DataCadastro = e.DataCadastro,
            DataAtualizacao = e.DataAtualizacao,
            Ativo = e.Ativo
        };
    }

    private static EmailTesteEnvioResultadoDto BuildTeste(
        bool ok, string mensagem, string dest, string assunto, ConfiguracaoEmail? cfg, int ms) => new()
    {
        Sucesso = ok,
        Mensagem = mensagem,
        MensagemRetorno = mensagem,
        DataHoraUtc = DateTime.UtcNow,
        DuracaoMs = ms,
        Destinatario = dest,
        Assunto = assunto,
        NomeRemetente = cfg?.NomeRemetente,
        EmailRemetente = cfg?.EmailRemetente,
        ReplyTo = cfg?.ReplyTo,
        Provedor = cfg?.Provedor,
        ServidorSmtp = cfg?.ServidorSmtp,
        Porta = cfg?.Porta
    };

    private static string MensagemConfigIndisponivel(ConfiguracaoEmail? cfg)
    {
        if (cfg == null) return "Configure e salve o servidor SMTP antes de testar.";
        if (string.IsNullOrWhiteSpace(cfg.SenhaCriptografada)) return "Informe e salve a senha SMTP antes de testar.";
        return "Não foi possível usar a senha salva. Informe a senha novamente, salve e teste de novo.";
    }

    private static void Validate(ConfiguracaoEmailUpsertDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.ServidorSmtp))
            throw new InvalidOperationException("Servidor SMTP é obrigatório.");
        if (dto.Porta is < 1 or > 65535)
            throw new InvalidOperationException("Porta inválida (1–65535).");
        if (string.IsNullOrWhiteSpace(dto.UsuarioSmtp))
            throw new InvalidOperationException("Usuário SMTP é obrigatório.");
        if (string.IsNullOrWhiteSpace(dto.NomeRemetente))
            throw new InvalidOperationException("Nome do remetente é obrigatório.");
        if (string.IsNullOrWhiteSpace(dto.EmailRemetente) || !IsValidEmail(dto.EmailRemetente.Trim()))
            throw new InvalidOperationException("E-mail do remetente inválido.");
        if (!EmailProvedorCodes.IsKnown(dto.Provedor))
            throw new InvalidOperationException("Provedor inválido.");
        if (!string.IsNullOrWhiteSpace(dto.ReplyTo) && !IsValidEmail(dto.ReplyTo.Trim()))
            throw new InvalidOperationException("Reply-To inválido.");
    }

    private static string NormalizeProvedor(string? code) =>
        string.Equals(code, EmailProvedorCodes.AmazonSesSmtp, StringComparison.OrdinalIgnoreCase)
            ? EmailProvedorCodes.AmazonSesSmtp
            : EmailProvedorCodes.SmtpGenerico;

    private static bool IsValidEmail(string email)
    {
        try { _ = new MailAddress(email); return true; }
        catch { return false; }
    }
}