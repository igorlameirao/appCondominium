using System.Text;
using AppCondominium.Application.Convites;
using AppCondominium.Application.DTOs;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Convites;
using AppCondominium.Domain.Entities;
using AppCondominium.Domain.Validators;
using AppCondominium.Domain.Vinculos;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AppCondominium.Infrastructure.Services;

public class ConviteAcessoService : IConviteAcessoService
{
    private readonly AppDbContext _db;
    private readonly ICondominioContext _tenant;
    private readonly IPessoaVinculoService _vinculoService;
    private readonly IPessoaCadastroService _pessoaCadastro;
    private readonly IPermissionResolver _permissionResolver;
    private readonly IEmailSender _emailSender;
    private readonly ConviteOptions _conviteOptions;
    private readonly ILogger<ConviteAcessoService> _logger;

    public ConviteAcessoService(
        AppDbContext db,
        ICondominioContext tenant,
        IPessoaVinculoService vinculoService,
        IPessoaCadastroService pessoaCadastro,
        IPermissionResolver permissionResolver,
        IEmailSender emailSender,
        IOptions<ConviteOptions> conviteOptions,
        ILogger<ConviteAcessoService> logger)
    {
        _db = db;
        _tenant = tenant;
        _vinculoService = vinculoService;
        _pessoaCadastro = pessoaCadastro;
        _permissionResolver = permissionResolver;
        _emailSender = emailSender;
        _conviteOptions = conviteOptions.Value;
        _logger = logger;
    }

    public async Task<EmitirConviteResponse> EmitirAsync(
        uint idPessoaEmissor, EmitirConviteRequest request, CancellationToken ct = default)
    {
        var idCondominio = _tenant.RequireTenantId();
        await ValidarEmissorAsync(idPessoaEmissor, idCondominio, request.IdPerfil, ct);

        var email = NormalizarEmail(request.Email);
        if (string.IsNullOrEmpty(email))
            throw new InvalidOperationException("E-mail do destinatário é obrigatório.");

        var cpf = string.IsNullOrWhiteSpace(request.Cpf)
            ? null
            : DocumentoValidator.NormalizarCpfCnpj(request.Cpf);
        if (cpf is { Length: > 0 and not 11 })
            throw new InvalidOperationException("CPF inválido.");

        var (idPessoa, tipo) = await ClassificarDestinatarioAsync(email, cpf, idCondominio, request, ct);

        var pendente = await _db.ConviteAcesso.IgnoreQueryFilters()
            .AnyAsync(c => c.IdCondominio == idCondominio
                && c.EmailDestinatario == email
                && c.Estado == ConviteAcessoEstado.Pendente
                && c.DataExpiracao > DateTime.UtcNow, ct);
        if (pendente)
            throw new InvalidOperationException("Já existe convite pendente para este e-mail neste condomínio.");

        if (tipo == ConviteTipoConvite.VinculoCondominioAdicional && idPessoa is uint pid)
        {
            var vinculoAtivo = await PossuiVinculoAtivoCompativelAsync(
                pid, idCondominio, request.CodigoPapelVinculo, request.IdUnidade, ct);
            if (vinculoAtivo)
                throw new InvalidOperationException("Já existe vínculo ativo para este destinatário com o mesmo papel.");
        }

        var token = ConviteTokenUtil.GerarToken();
        var agora = DateTime.UtcNow;
        var convite = new ConviteAcesso
        {
            IdCondominio = idCondominio,
            IdPessoaDestinatario = idPessoa,
            EmailDestinatario = email,
            CpfDestinatario = cpf,
            TipoConvite = tipo,
            CodigoPapelVinculo = request.CodigoPapelVinculo,
            IdPerfil = request.IdPerfil,
            IdUnidade = request.IdUnidade,
            IdPessoaRelacionada = request.IdPessoaRelacionada,
            TokenHash = ConviteTokenUtil.HashToken(token),
            DataEmissao = agora,
            DataExpiracao = agora.AddHours(Math.Max(1, _conviteOptions.ValidadeHoras)),
            Estado = ConviteAcessoEstado.Pendente,
            IdPessoaEmissor = idPessoaEmissor,
            EstadoEnvioEmail = ConviteEnvioEmailEstado.Pendente,
            TentativasEnvioEmail = 0,
            Observacao = request.Observacao?.Trim()
        };

        if (idPessoa is uint pidDestino)
        {
            var rascunho = MontarPessoaVinculoRascunho(convite, pidDestino);
            await _vinculoService.ValidarAntesGravarAsync(rascunho, inclusao: true, ct);
        }
        else
            await ValidarEstruturaConviteAsync(convite, ct);

        _db.ConviteAcesso.Add(convite);
        await _db.SaveChangesAsync(ct);

        var estadoEnvio = await TentarEnviarEmailAsync(convite, token, ct);
        await _db.SaveChangesAsync(ct);

        var msg = estadoEnvio == ConviteEnvioEmailEstado.Falha
            ? "Convite criado. O envio de e-mail falhou; será reprocessado automaticamente."
            : "Convite criado. O e-mail foi enfileirado e será enviado em breve.";

        return new EmitirConviteResponse(convite.IdConvite!.Value, estadoEnvio, msg);
    }

    public async Task<IReadOnlyList<ConviteListItemDto>> ListarAsync(
        uint idCondominio, string? filtroEmail, CancellationToken ct = default)
    {
        var query = _db.ConviteAcesso.AsNoTracking()
            .Where(c => c.IdCondominio == idCondominio);

        if (!string.IsNullOrWhiteSpace(filtroEmail))
        {
            var f = NormalizarEmail(filtroEmail);
            query = query.Where(c => c.EmailDestinatario!.Contains(f));
        }

        var condoNome = await _db.Condominio.AsNoTracking()
            .Where(c => c.IdCondominio == idCondominio)
            .Select(c => c.Nome)
            .FirstOrDefaultAsync(ct);

        var itens = await query
            .OrderByDescending(c => c.DataEmissao)
            .Take(200)
            .ToListAsync(ct);

        return itens.Select(c => new ConviteListItemDto(
            c.IdConvite!.Value,
            MascararEmail(c.EmailDestinatario),
            MascararCpf(c.CpfDestinatario),
            c.TipoConvite ?? 0,
            c.Estado ?? 0,
            c.EstadoEnvioEmail ?? ConviteEnvioEmailEstado.Pendente,
            c.DataEmissao ?? DateTime.MinValue,
            c.DataExpiracao ?? DateTime.MinValue,
            c.DataAceite,
            condoNome,
            c.IdVinculoCriado)).ToList();
    }

    public async Task<EmitirConviteResponse> ReenviarAsync(uint idConvite, uint idPessoaEmissor, CancellationToken ct = default)
    {
        var idCondominio = _tenant.RequireTenantId();
        var convite = await _db.ConviteAcesso.IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.IdConvite == idConvite && c.IdCondominio == idCondominio, ct)
            ?? throw new InvalidOperationException("Convite não encontrado.");

        if (convite.Estado is ConviteAcessoEstado.Aceito or ConviteAcessoEstado.Revogado)
            throw new InvalidOperationException("Convite não pode ser reenviado neste estado.");

        await ValidarEmissorAsync(idPessoaEmissor, idCondominio, convite.IdPerfil, ct);

        var token = ConviteTokenUtil.GerarToken();
        convite.TokenHash = ConviteTokenUtil.HashToken(token);
        convite.DataEmissao = DateTime.UtcNow;
        convite.DataExpiracao = convite.DataEmissao.Value.AddHours(Math.Max(1, _conviteOptions.ValidadeHoras));
        convite.Estado = ConviteAcessoEstado.Pendente;
        convite.EstadoEnvioEmail = ConviteEnvioEmailEstado.Pendente;
        convite.TentativasEnvioEmail = 0;
        convite.UltimoErroEnvio = null;

        var estadoEnvio = await TentarEnviarEmailAsync(convite, token, ct);
        await _db.SaveChangesAsync(ct);

        return new EmitirConviteResponse(
            convite.IdConvite!.Value,
            estadoEnvio,
            estadoEnvio == ConviteEnvioEmailEstado.Falha
                ? "Convite atualizado. O envio de e-mail falhou; será reprocessado."
                : "Convite reenviado. O e-mail foi enfileirado.");
    }

    public async Task RevogarAsync(uint idConvite, uint idPessoaEmissor, CancellationToken ct = default)
    {
        var idCondominio = _tenant.RequireTenantId();
        await ValidarEmissorAsync(idPessoaEmissor, idCondominio, null, ct);

        var convite = await _db.ConviteAcesso.IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.IdConvite == idConvite && c.IdCondominio == idCondominio, ct)
            ?? throw new InvalidOperationException("Convite não encontrado.");

        if (convite.Estado == ConviteAcessoEstado.Aceito)
            throw new InvalidOperationException("Convite já utilizado.");

        convite.Estado = ConviteAcessoEstado.Revogado;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<ValidarConviteResponse> ValidarTokenAsync(string token, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(token))
            return RespostaInvalida("vazio", "Convite inválido ou indisponível.");

        var hash = ConviteTokenUtil.HashToken(token.Trim());
        var convite = await _db.ConviteAcesso.IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.TokenHash == hash, ct);

        if (convite is null)
            return RespostaInvalida("nao_encontrado", "Convite inválido ou indisponível.");

        AtualizarEstadoExpirado(convite);
        if (convite.Estado == ConviteAcessoEstado.Revogado)
            return RespostaInvalida("revogado", "Este convite foi revogado.");
        if (convite.Estado == ConviteAcessoEstado.Aceito)
            return RespostaInvalida("utilizado", "Este convite já foi utilizado.");
        if (convite.Estado == ConviteAcessoEstado.Expirado || convite.DataExpiracao <= DateTime.UtcNow)
            return RespostaInvalida("expirado", "Este convite expirou.");

        var nomeCondo = await _db.Condominio.IgnoreQueryFilters().AsNoTracking()
            .Where(c => c.IdCondominio == convite.IdCondominio)
            .Select(c => c.Nome)
            .FirstOrDefaultAsync(ct);

        var requerAuth = convite.TipoConvite == ConviteTipoConvite.VinculoCondominioAdicional;
        var requerSenha = convite.TipoConvite is ConviteTipoConvite.AtivacaoContaNova
            or ConviteTipoConvite.AtivacaoCredencialExistente;

        return new ValidarConviteResponse(
            true,
            "ok",
            "Convite válido.",
            convite.TipoConvite,
            requerAuth,
            requerSenha,
            nomeCondo,
            MascararEmail(convite.EmailDestinatario),
            convite.DataExpiracao,
            convite.IdConvite);
    }

    public async Task<AceitarConviteResponse> AceitarContaNovaAsync(
        AceitarConviteContaNovaRequest request, CancellationToken ct = default)
    {
        var hash = ConviteTokenUtil.HashToken(request.Token.Trim());
        await using var tx = await _db.Database.BeginTransactionAsync(ct);

        var convite = await _db.ConviteAcesso.IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.TokenHash == hash, ct)
            ?? throw new InvalidOperationException("Convite inválido ou indisponível.");

        if (convite.TipoConvite == ConviteTipoConvite.VinculoCondominioAdicional)
            throw new InvalidOperationException("Este convite exige autenticação na conta existente.");

        await GarantirConvitePendenteAsync(convite, ct);

        var email = NormalizarEmail(request.Email);
        var cpf = DocumentoValidator.NormalizarCpfCnpj(request.Cpf);
        if (cpf.Length != 11)
            throw new InvalidOperationException("CPF inválido.");
        if (email != convite.EmailDestinatario)
            throw new InvalidOperationException("E-mail não corresponde ao convite.");
        if (convite.CpfDestinatario is not null && convite.CpfDestinatario != cpf)
            throw new InvalidOperationException("CPF não corresponde ao convite.");

        var pessoaReq = new PessoaFisicaIntegradaRequest
        {
            CPFCNPJ = cpf,
            Nome = request.Nome.Trim(),
            Telefone = request.Telefone?.Trim(),
            DataNascimento = request.DataNascimento,
            Email = email,
            Senha = request.Senha
        };

        var modo = convite.IdPessoaDestinatario is uint idExistente
            ? PessoaCadastroModo.ReutilizacaoPessoaExistente
            : PessoaCadastroModo.Completo;

        if (modo == PessoaCadastroModo.ReutilizacaoPessoaExistente)
        {
            var pf = await _db.Pessoafisica.IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.IdPessoa == convite.IdPessoaDestinatario, ct);
            if (!string.IsNullOrEmpty(pf?.Senha))
                throw new InvalidOperationException("Conta já ativa. Utilize login para aceitar o convite.");
            pessoaReq.Senha = request.Senha;
        }

        var pessoa = await _pessoaCadastro.CriarOuAtualizarPessoaFisicaAsync(
            pessoaReq, convite.IdPessoaDestinatario, ct, modo);

        var vinculo = await CriarVinculoNoAceiteAsync(convite, pessoa.IdPessoa, ct);
        await ConsumirConviteAsync(convite, vinculo.IdVinculo, pessoa.IdPessoa, ct);
        await tx.CommitAsync(ct);

        return new AceitarConviteResponse(
            true,
            "Conta ativada com sucesso. Você já pode entrar com suas credenciais.",
            convite.IdCondominio,
            vinculo.IdVinculo);
    }

    public async Task<AceitarConviteResponse> AceitarAutenticadoAsync(
        uint idPessoaAutenticada, AceitarConviteAutenticadoRequest request, CancellationToken ct = default)
    {
        var hash = ConviteTokenUtil.HashToken(request.Token.Trim());
        await using var tx = await _db.Database.BeginTransactionAsync(ct);

        var convite = await _db.ConviteAcesso.IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.TokenHash == hash, ct)
            ?? throw new InvalidOperationException("Convite inválido ou indisponível.");

        if (convite.TipoConvite != ConviteTipoConvite.VinculoCondominioAdicional)
            throw new InvalidOperationException("Este convite não exige autenticação ou use a ativação de conta.");

        await GarantirConvitePendenteAsync(convite, ct);
        await ConfirmarIdentidadeDestinatarioAsync(convite, idPessoaAutenticada, ct);

        var vinculoAtivo = await PossuiVinculoAtivoCompativelAsync(
            idPessoaAutenticada,
            convite.IdCondominio!.Value,
            convite.CodigoPapelVinculo!.Value,
            convite.IdUnidade,
            ct);
        if (vinculoAtivo)
        {
            convite.Estado = ConviteAcessoEstado.Aceito;
            convite.DataAceite = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return new AceitarConviteResponse(true, "Vínculo já existente.", convite.IdCondominio, null);
        }

        var vinculo = await CriarVinculoNoAceiteAsync(convite, idPessoaAutenticada, ct);
        await ConsumirConviteAsync(convite, vinculo.IdVinculo, idPessoaAutenticada, ct);
        await tx.CommitAsync(ct);

        return new AceitarConviteResponse(
            true,
            "Convite aceito. O novo condomínio estará disponível na seleção ao entrar.",
            convite.IdCondominio,
            vinculo.IdVinculo);
    }

    public async Task ProcessarEnviosPendentesAsync(CancellationToken ct = default)
    {
        await SincronizarEstadosEmailFilaAsync(ct);

        var pendentes = await _db.ConviteAcesso.IgnoreQueryFilters()
            .Where(c => c.Estado == ConviteAcessoEstado.Pendente
                && c.EstadoEnvioEmail != ConviteEnvioEmailEstado.Enviado
                && c.TentativasEnvioEmail < _conviteOptions.MaxTentativasEnvioEmail)
            .OrderBy(c => c.DataEmissao)
            .Take(20)
            .ToListAsync(ct);

        foreach (var convite in pendentes)
        {
            try
            {
                var token = ConviteTokenUtil.GerarToken();
                convite.TokenHash = ConviteTokenUtil.HashToken(token);
                await TentarEnviarEmailAsync(convite, token, ct);
                await _db.SaveChangesAsync(ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Falha ao reprocessar envio do convite {IdConvite}", convite.IdConvite);
            }
        }
    }

    private async Task ValidarEmissorAsync(
        uint idPessoaEmissor, uint idCondominio, uint? idPerfilConvite, CancellationToken ct)
    {
        var snap = await _permissionResolver.SnapshotAsync(idPessoaEmissor, idCondominio, ct);
        if (!snap.AcessoTotal)
        {
            if (!await _permissionResolver.HasAsync(
                    idPessoaEmissor, idCondominio, "CONVITEACESSO", "Incluir", ct))
                throw new InvalidOperationException("Sem permissão para emitir convites.");
        }

        if (idPerfilConvite is uint idPerfil)
        {
            var perfil = await _db.PerfilAcesso.AsNoTracking()
                .FirstOrDefaultAsync(p => p.IdPerfil == idPerfil, ct);
            if (perfil is null)
                throw new InvalidOperationException("Perfil inválido.");
            if (perfil.Descricao?.Equals("Administrador", StringComparison.OrdinalIgnoreCase) == true
                && !snap.AcessoTotal)
                throw new InvalidOperationException("Sem permissão para atribuir perfil Administrador.");
        }
    }

    private async Task<(uint? IdPessoa, byte Tipo)> ClassificarDestinatarioAsync(
        string email, string? cpf, uint idCondominio, EmitirConviteRequest request, CancellationToken ct)
    {
        uint? idPessoa = request.IdPessoaDestinatario;
        if (idPessoa is null or 0)
        {
            if (cpf is not null)
            {
                idPessoa = await _db.Pessoa.IgnoreQueryFilters()
                    .Where(p => p.CPFCNPJ == cpf)
                    .Select(p => p.IdPessoa)
                    .FirstOrDefaultAsync(ct);
            }

            if (idPessoa is null or 0)
            {
                idPessoa = await _db.Pessoafisica.IgnoreQueryFilters()
                    .Where(p => p.Email == email)
                    .Select(p => p.IdPessoa)
                    .FirstOrDefaultAsync(ct);
            }
        }

        if (idPessoa is null or 0)
            return (null, ConviteTipoConvite.AtivacaoContaNova);

        var pf = await _db.Pessoafisica.IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.IdPessoa == idPessoa, ct);

        var temSenha = !string.IsNullOrEmpty(pf?.Senha);
        if (!temSenha)
            return (idPessoa, ConviteTipoConvite.AtivacaoCredencialExistente);

        return (idPessoa, ConviteTipoConvite.VinculoCondominioAdicional);
    }

    private static PessoaVinculo MontarPessoaVinculoRascunho(ConviteAcesso convite, uint? idPessoa) => new()
    {
        IdPessoa = idPessoa ?? 1,
        IdCondominio = convite.IdCondominio,
        CodigoPapelVinculo = convite.CodigoPapelVinculo,
        IdPerfil = convite.IdPerfil,
        IdUnidade = convite.IdUnidade,
        IdPessoaRelacionada = convite.IdPessoaRelacionada,
        DataInicio = PessoaVinculoAtivo.HojeUtc(),
        Responsavel = 0
    };

    private async Task<PessoaVinculo> CriarVinculoNoAceiteAsync(
        ConviteAcesso convite, uint idPessoa, CancellationToken ct)
    {
        var vinculo = new PessoaVinculo
        {
            IdPessoa = idPessoa,
            IdCondominio = convite.IdCondominio,
            CodigoPapelVinculo = convite.CodigoPapelVinculo,
            IdPerfil = convite.IdPerfil,
            IdUnidade = convite.IdUnidade,
            IdPessoaRelacionada = convite.IdPessoaRelacionada,
            DataInicio = PessoaVinculoAtivo.HojeUtc(),
            Responsavel = 0
        };

        await _vinculoService.ValidarAntesGravarAsync(vinculo, inclusao: true, ct);
        _db.PessoaVinculo.Add(vinculo);
        await _db.SaveChangesAsync(ct);
        await _vinculoService.AplicarAjustesAposGravarAsync(vinculo, ct);
        return vinculo;
    }

    private Task GarantirConvitePendenteAsync(ConviteAcesso convite, CancellationToken ct)
    {
        AtualizarEstadoExpirado(convite);
        if (convite.Estado == ConviteAcessoEstado.Aceito)
            throw new InvalidOperationException("Convite já utilizado.");
        if (convite.Estado == ConviteAcessoEstado.Revogado)
            throw new InvalidOperationException("Convite revogado.");
        if (convite.Estado == ConviteAcessoEstado.Expirado || convite.DataExpiracao <= DateTime.UtcNow)
            throw new InvalidOperationException("Convite expirado.");
        if (convite.Estado != ConviteAcessoEstado.Pendente)
            throw new InvalidOperationException("Convite indisponível.");
        return Task.CompletedTask;
    }

    private async Task ConsumirConviteAsync(
        ConviteAcesso convite, uint? idVinculo, uint idPessoa, CancellationToken ct)
    {
        var atual = await _db.ConviteAcesso.IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.IdConvite == convite.IdConvite && c.Estado == ConviteAcessoEstado.Pendente, ct);
        if (atual is null)
            throw new InvalidOperationException("Convite já foi utilizado ou não está mais disponível.");

        atual.Estado = ConviteAcessoEstado.Aceito;
        atual.DataAceite = DateTime.UtcNow;
        atual.IdVinculoCriado = idVinculo;
        atual.IdPessoaDestinatario = idPessoa;
        await _db.SaveChangesAsync(ct);
    }

    private async Task ValidarEstruturaConviteAsync(ConviteAcesso convite, CancellationToken ct)
    {
        var rascunho = MontarPessoaVinculoRascunho(convite, 1);
        try
        {
            await _vinculoService.ValidarAntesGravarAsync(rascunho, inclusao: true, ct);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("IdPessoa"))
        {
            var papel = await _db.PapelVinculo.IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.CodigoPapelVinculo == convite.CodigoPapelVinculo, ct)
                ?? throw new InvalidOperationException("Papel de vínculo inexistente.");
            _ = papel;
            if (convite.IdUnidade is uint idUnidade)
            {
                var unidade = await _db.Unidade.IgnoreQueryFilters()
                    .FirstOrDefaultAsync(u => u.IdUnidade == idUnidade, ct)
                    ?? throw new InvalidOperationException("Unidade inexistente.");
                if (unidade.IdCondominio != convite.IdCondominio)
                    throw new InvalidOperationException("A unidade não pertence ao condomínio.");
            }
        }
    }

    private async Task ConfirmarIdentidadeDestinatarioAsync(
        ConviteAcesso convite, uint idPessoaAutenticada, CancellationToken ct)
    {
        if (convite.IdPessoaDestinatario is uint dest && dest != idPessoaAutenticada)
            throw new InvalidOperationException("Conta autenticada não corresponde ao destinatário do convite.");

        var pf = await _db.Pessoafisica.IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdPessoa == idPessoaAutenticada, ct);
        var pessoa = await _db.Pessoa.IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdPessoa == idPessoaAutenticada, ct);

        if (pf?.Email is not null
            && !string.Equals(pf.Email, convite.EmailDestinatario, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("E-mail da conta não corresponde ao convite.");

        if (convite.CpfDestinatario is not null
            && pessoa?.CPFCNPJ != convite.CpfDestinatario)
            throw new InvalidOperationException("CPF da conta não corresponde ao convite.");
    }

    private async Task<bool> PossuiVinculoAtivoCompativelAsync(
        uint idPessoa, uint idCondominio, uint codigoPapel, uint? idUnidade, CancellationToken ct)
    {
        var vinculos = await _db.PessoaVinculo.IgnoreQueryFilters()
            .Where(v => v.IdPessoa == idPessoa
                && v.IdCondominio == idCondominio
                && v.CodigoPapelVinculo == codigoPapel
                && v.IdUnidade == idUnidade)
            .ToListAsync(ct);

        return vinculos.Any(v => PessoaVinculoAtivo.EstaAtivo(v.DataInicio, v.DataFim));
    }

    private async Task SincronizarEstadosEmailFilaAsync(CancellationToken ct)
    {
        var pares = await _db.ConviteAcesso.IgnoreQueryFilters()
            .Where(c => c.IdEmailQueue != null
                && c.EstadoEnvioEmail != ConviteEnvioEmailEstado.Enviado)
            .Select(c => new { c.IdConvite, QueueId = c.IdEmailQueue!.Value })
            .Take(100)
            .ToListAsync(ct);
        if (pares.Count == 0) return;

        var ids = pares.Select(p => p.QueueId).Distinct().ToList();
        var fila = await _db.EmailQueues.AsNoTracking()
            .Where(e => ids.Contains(e.Id))
            .ToDictionaryAsync(e => e.Id, ct);

        foreach (var p in pares)
        {
            if (!fila.TryGetValue(p.QueueId, out var row)) continue;
            var convite = await _db.ConviteAcesso.IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.IdConvite == p.IdConvite, ct);
            if (convite is null) continue;

            if (row.Status == EmailQueueStatus.Enviado)
            {
                convite.EstadoEnvioEmail = ConviteEnvioEmailEstado.Enviado;
                convite.UltimoErroEnvio = null;
            }
            else if (row.Status == EmailQueueStatus.Erro)
            {
                convite.EstadoEnvioEmail = ConviteEnvioEmailEstado.Falha;
                convite.UltimoErroEnvio = row.MensagemErro is { Length: > 500 }
                    ? row.MensagemErro[..500]
                    : row.MensagemErro;
            }
        }
        await _db.SaveChangesAsync(ct);
    }

    private async Task<byte> TentarEnviarEmailAsync(ConviteAcesso convite, string token, CancellationToken ct)
    {
        convite.TentativasEnvioEmail = (convite.TentativasEnvioEmail ?? 0) + 1;

        var nomeCondo = await _db.Condominio.IgnoreQueryFilters().AsNoTracking()
            .Where(c => c.IdCondominio == convite.IdCondominio)
            .Select(c => c.Nome)
            .FirstOrDefaultAsync(ct) ?? "Condomínio";

        var link = $"{_conviteOptions.AceiteBaseUrl.TrimEnd('/')}?token={Uri.EscapeDataString(token)}";
        var html = ConviteEmailTemplate.MontarHtml(nomeCondo, link, convite.DataExpiracao ?? DateTime.UtcNow);
        var texto = $"Convite de acesso ao condomínio {nomeCondo}. Link: {link}";

        try
        {
            var filaId = await _emailSender.EnviarAsync(new EmailMessage(
                convite.EmailDestinatario!,
                $"Convite de acesso — {nomeCondo}",
                html,
                texto), ct);
            if (filaId <= 0)
            {
                convite.EstadoEnvioEmail = ConviteEnvioEmailEstado.Falha;
                convite.UltimoErroEnvio = "Não foi possível enfileirar o e-mail.";
                return ConviteEnvioEmailEstado.Falha;
            }

            convite.IdEmailQueue = filaId;
            convite.EstadoEnvioEmail = ConviteEnvioEmailEstado.Pendente;
            convite.UltimoErroEnvio = null;
            return ConviteEnvioEmailEstado.Pendente;
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Falha ao enfileirar convite {IdConvite} (tentativa {N})", convite.IdConvite, convite.TentativasEnvioEmail);
            convite.EstadoEnvioEmail = ConviteEnvioEmailEstado.Falha;
            convite.UltimoErroEnvio = ex.Message.Length > 500 ? ex.Message[..500] : ex.Message;
            return ConviteEnvioEmailEstado.Falha;
        }
    }

    private void AtualizarEstadoExpirado(ConviteAcesso convite)
    {
        if (convite.Estado == ConviteAcessoEstado.Pendente
            && convite.DataExpiracao is not null
            && convite.DataExpiracao <= DateTime.UtcNow)
            convite.Estado = ConviteAcessoEstado.Expirado;
    }

    private static string NormalizarEmail(string email) =>
        email.Trim().ToLowerInvariant();

    private static ValidarConviteResponse RespostaInvalida(string codigo, string mensagem) =>
        new(false, codigo, mensagem, null, false, false, null, null, null, null);

    internal static string MascararEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email)) return "—";
        var at = email.IndexOf('@');
        if (at <= 1) return "***";
        return email[0] + "***" + email[at..];
    }

    internal static string? MascararCpf(string? cpf)
    {
        if (string.IsNullOrWhiteSpace(cpf) || cpf.Length < 11) return null;
        return "***" + cpf[^4..];
    }
}

internal static class ConviteEmailTemplate
{
    public static string MontarHtml(string nomeCondominio, string link, DateTime expiraEm)
    {
        var expira = expiraEm.ToString("dd/MM/yyyy HH:mm") + " UTC";
        return $"""
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="font-family:Segoe UI,Roboto,sans-serif;background:#f1f5f9;margin:0;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:10px;border:1px solid #e2e8f0;padding:28px;">
    <h1 style="font-size:20px;color:#0f172a;margin:0 0 12px;">Convite de acesso</h1>
    <p style="color:#334155;line-height:1.5;">Você foi convidado(a) para acessar o condomínio <strong>{System.Net.WebUtility.HtmlEncode(nomeCondominio)}</strong>.</p>
    <p style="color:#334155;line-height:1.5;">Válido até <strong>{expira}</strong>.</p>
  <p style="margin:24px 0;"><a href="{System.Net.WebUtility.HtmlEncode(link)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600;">Aceitar convite</a></p>
    <p style="font-size:12px;color:#64748b;">Se o botão não funcionar, copie e cole o link no navegador:<br/>{System.Net.WebUtility.HtmlEncode(link)}</p>
  </div>
</body>
</html>
""";
    }
}