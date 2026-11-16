using AppCondominium.Application.Interfaces;
using AppCondominium.Application.RecuperacaoSenha;
using AppCondominium.Domain.Convites;
using AppCondominium.Domain.Entities;
using AppCondominium.Domain.RecuperacaoSenha;
using AppCondominium.Domain.Vinculos;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AppCondominium.Infrastructure.Services;

public class PasswordRecoveryService : IPasswordRecoveryService
{
    private const string MensagemGenericaSolicitacao =
        "Se o e-mail estiver cadastrado, você receberá instruções para redefinir a senha em breve.";

    private readonly AppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailSender _emailSender;
    private readonly PasswordRecoveryOptions _options;
    private readonly ILogger<PasswordRecoveryService> _logger;

    public PasswordRecoveryService(
        AppDbContext db,
        IPasswordHasher passwordHasher,
        IEmailSender emailSender,
        IOptions<PasswordRecoveryOptions> options,
        ILogger<PasswordRecoveryService> logger)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _emailSender = emailSender;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<SolicitarRecuperacaoSenhaResponse> SolicitarAsync(string email, CancellationToken ct = default)
    {
        var normalizado = NormalizarEmail(email);
        if (string.IsNullOrEmpty(normalizado) || !normalizado.Contains('@'))
            return new SolicitarRecuperacaoSenhaResponse(MensagemGenericaSolicitacao);

        var pf = await _db.Pessoafisica.IgnoreQueryFilters().AsNoTracking()
            .FirstOrDefaultAsync(p => p.Email != null && p.Email.ToLower() == normalizado, ct);

        if (pf is null || pf.IdPessoa is not uint idPessoa)
            return new SolicitarRecuperacaoSenhaResponse(MensagemGenericaSolicitacao);

        var temVinculoAtivo = await PossuiVinculoAtivoAsync(idPessoa, ct);
        if (!temVinculoAtivo)
            return new SolicitarRecuperacaoSenhaResponse(MensagemGenericaSolicitacao);

        var agora = DateTime.UtcNow;
        var validade = Math.Max(5, _options.ValidadeMinutos);
        var expira = agora.AddMinutes(validade);

        var pendentes = await _db.RecuperacaoSenhaToken
            .Where(t => t.IdPessoa == idPessoa && t.Estado == RecuperacaoSenhaEstado.Pendente)
            .ToListAsync(ct);
        foreach (var antigo in pendentes)
        {
            antigo.Estado = RecuperacaoSenhaEstado.Invalidado;
            antigo.DataConsumo = agora;
        }

        var token = ConviteTokenUtil.GerarToken();
        var registro = new RecuperacaoSenhaToken
        {
            IdPessoa = idPessoa,
            TokenHash = ConviteTokenUtil.HashToken(token),
            EmailNormalizado = normalizado,
            DataCriacao = agora,
            DataExpiracao = expira,
            Estado = RecuperacaoSenhaEstado.Pendente
        };
        _db.RecuperacaoSenhaToken.Add(registro);
        await _db.SaveChangesAsync(ct);

        try
        {
            var nome = await _db.Pessoa.IgnoreQueryFilters().AsNoTracking()
                .Where(p => p.IdPessoa == idPessoa)
                .Select(p => p.Nome)
                .FirstOrDefaultAsync(ct) ?? "Usuário";

            var link = $"{_options.RedefinirBaseUrl.TrimEnd('/')}?token={Uri.EscapeDataString(token)}";
            var html = PasswordRecoveryEmailTemplate.MontarHtml(nome.Trim(), link, expira);
            var texto = PasswordRecoveryEmailTemplate.MontarTexto(nome.Trim(), link, expira);

            var filaId = await _emailSender.EnviarAsync(new EmailMessage(
                normalizado,
                "Redefinição de senha — AppCondominium",
                html,
                texto), ct);

            if (filaId > 0)
            {
                registro.IdEmailQueue = filaId;
                await _db.SaveChangesAsync(ct);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Falha ao enfileirar e-mail de recuperação para IdPessoa {IdPessoa}", idPessoa);
        }

        return new SolicitarRecuperacaoSenhaResponse(MensagemGenericaSolicitacao);
    }

    public async Task<ValidarRecuperacaoSenhaResponse> ValidarTokenAsync(string token, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(token))
            return Invalido("vazio", "Link inválido ou expirado.");

        var hash = ConviteTokenUtil.HashToken(token.Trim());
        var registro = await _db.RecuperacaoSenhaToken.AsNoTracking()
            .FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

        return AvaliarRegistro(registro);
    }

    public async Task<RedefinirSenhaRecuperacaoResponse> RedefinirAsync(
        RedefinirSenhaRecuperacaoRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
            return new RedefinirSenhaRecuperacaoResponse(false, "Link inválido ou expirado.");

        if (string.IsNullOrWhiteSpace(request.SenhaNova) || request.SenhaNova.Trim().Length < 8)
            return new RedefinirSenhaRecuperacaoResponse(false, "A nova senha deve ter pelo menos 8 caracteres.");

        var hash = ConviteTokenUtil.HashToken(request.Token.Trim());
        var strategy = _db.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await _db.Database.BeginTransactionAsync(ct);

            var registro = await _db.RecuperacaoSenhaToken
                .FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

            var avaliacao = AvaliarRegistro(registro);
            if (!avaliacao.Valido || registro is null)
                return new RedefinirSenhaRecuperacaoResponse(false, avaliacao.Mensagem);

            if (!await PossuiVinculoAtivoAsync(registro.IdPessoa, ct))
            {
                registro.Estado = RecuperacaoSenhaEstado.Invalidado;
                registro.DataConsumo = DateTime.UtcNow;
                await _db.SaveChangesAsync(ct);
                await tx.CommitAsync(ct);
                return new RedefinirSenhaRecuperacaoResponse(false, "Link inválido ou expirado.");
            }

            var pf = await _db.Pessoafisica.IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.IdPessoa == registro.IdPessoa, ct);
            if (pf is null)
                return new RedefinirSenhaRecuperacaoResponse(false, "Link inválido ou expirado.");

            var atual = await _db.RecuperacaoSenhaToken
                .FirstOrDefaultAsync(t => t.IdRecuperacaoSenha == registro.IdRecuperacaoSenha
                    && t.Estado == RecuperacaoSenhaEstado.Pendente
                    && t.DataExpiracao > DateTime.UtcNow, ct);
            if (atual is null)
                return new RedefinirSenhaRecuperacaoResponse(false, "Este link já foi utilizado ou expirou.");

            atual.Estado = RecuperacaoSenhaEstado.Consumido;
            atual.DataConsumo = DateTime.UtcNow;
            pf.Senha = _passwordHasher.Hash(request.SenhaNova.Trim());
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            return new RedefinirSenhaRecuperacaoResponse(
                true,
                "Senha redefinida com sucesso. Faça login com sua nova senha.");
        });
    }

    private static ValidarRecuperacaoSenhaResponse AvaliarRegistro(RecuperacaoSenhaToken? registro)
    {
        if (registro is null)
            return Invalido("nao_encontrado", "Link inválido ou expirado.");

        if (registro.Estado == RecuperacaoSenhaEstado.Consumido)
            return Invalido("consumido", "Este link já foi utilizado.");

        if (registro.Estado == RecuperacaoSenhaEstado.Invalidado)
            return Invalido("invalidado", "Link inválido ou expirado.");

        if (registro.DataExpiracao <= DateTime.UtcNow)
            return Invalido("expirado", "Link inválido ou expirado.");

        return new ValidarRecuperacaoSenhaResponse(true, "ok", "Link válido.");
    }

    private static ValidarRecuperacaoSenhaResponse Invalido(string codigo, string mensagem) =>
        new(false, codigo, mensagem);

    private async Task<bool> PossuiVinculoAtivoAsync(uint idPessoa, CancellationToken ct)
    {
        var hoje = DateOnly.FromDateTime(DateTime.UtcNow);
        return await _db.PessoaVinculo.IgnoreQueryFilters().AsNoTracking()
            .AnyAsync(v => v.IdPessoa == idPessoa
                && v.DataInicio <= hoje
                && (v.DataFim == null || v.DataFim >= hoje), ct);
    }

    private static string NormalizarEmail(string email) =>
        email.Trim().ToLowerInvariant();
}