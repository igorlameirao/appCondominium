using AppCondominium.Application.Common;
using AppCondominium.Application.DTOs;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Domain.Validators;
using AppCondominium.Domain.Vinculos;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.Infrastructure.Services;

public class PessoaConsultaService : IPessoaConsultaService
{
    private readonly AppDbContext _db;
    private readonly ICondominioContext _condominio;

    public PessoaConsultaService(AppDbContext db, ICondominioContext condominio)
    {
        _db = db;
        _condominio = condominio;
    }

    public async Task<PagedResult<PessoaListagemItemDto>> ListarAsync(
        int page, int pageSize, string? filter, string? tipo, string? situacao,
        string? escopoPapel, IReadOnlyCollection<uint>? codigosPapel, bool? vigente,
        CancellationToken ct = default)
    {
        var tenantId = _condominio.RequireTenantId();
        var hoje = DateOnly.FromDateTime(DateTime.UtcNow);
        var contextual = (codigosPapel is { Count: > 0 }) || !string.IsNullOrWhiteSpace(escopoPapel);

        var vinculoBase = _db.PessoaVinculo.AsNoTracking().Where(v => v.IdCondominio == tenantId);
        if (codigosPapel is { Count: > 0 })
            vinculoBase = vinculoBase.Where(v => v.CodigoPapelVinculo != null && codigosPapel.Contains(v.CodigoPapelVinculo.Value));
        vinculoBase = AplicarEscopo(vinculoBase, escopoPapel);
        if (vigente == true)
            vinculoBase = vinculoBase.Where(v => v.DataInicio <= hoje && (v.DataFim == null || v.DataFim >= hoje));
        else if (vigente == false)
            vinculoBase = vinculoBase.Where(v => v.DataFim != null && v.DataFim < hoje);

        var idsVinculo = vinculoBase.Select(v => v.IdPessoa);
        List<uint?> idsPessoa;
        if (contextual)
        {
            idsPessoa = await idsVinculo.Distinct().ToListAsync(ct);
        }
        else
        {
            var idsFornecedor = _db.Fornecedor.AsNoTracking()
                .Where(f => f.IdCondominio == tenantId)
                .Select(f => f.IdPessoa);
            idsPessoa = await idsVinculo.Union(idsFornecedor).Distinct().ToListAsync(ct);
        }
        if (idsPessoa.Count == 0)
        {
            return new PagedResult<PessoaListagemItemDto>
            {
                Items = Array.Empty<PessoaListagemItemDto>(),
                TotalCount = 0,
                Page = page,
                PageSize = pageSize
            };
        }

        var query = _db.Pessoa.AsNoTracking().Where(p => idsPessoa.Contains(p.IdPessoa));

        if (!string.IsNullOrWhiteSpace(filter))
        {
            var f = filter.Trim();
            var digits = DocumentoValidator.NormalizarCpfCnpj(f);
            if (!string.IsNullOrEmpty(digits) && digits.Length >= 3)
            {
                query = query.Where(p =>
                    (p.Nome != null && p.Nome.Contains(f))
                    || (p.CPFCNPJ != null && p.CPFCNPJ.Contains(digits)));
            }
            else if (f.Length >= 3)
            {
                query = query.Where(p => p.Nome != null && p.Nome.Contains(f));
            }
        }

        var pessoas = await query.OrderBy(p => p.Nome).ToListAsync(ct);
        var ids = pessoas.Select(p => p.IdPessoa!.Value).ToList();

        var pjRows = await _db.PessoaJuridica.AsNoTracking()
            .Where(p => ids.Contains(p.IdPessoa!.Value))
            .ToDictionaryAsync(p => p.IdPessoa!.Value, ct);
        var pfRows = await _db.Pessoafisica.AsNoTracking()
            .Where(p => ids.Contains(p.IdPessoa!.Value))
            .ToDictionaryAsync(p => p.IdPessoa!.Value, ct);

        var vinculosQuery = _db.PessoaVinculo.AsNoTracking()
            .Where(v => v.IdCondominio == tenantId && ids.Contains(v.IdPessoa!.Value));
        if (contextual)
        {
            if (codigosPapel is { Count: > 0 })
                vinculosQuery = vinculosQuery.Where(v => v.CodigoPapelVinculo != null && codigosPapel.Contains(v.CodigoPapelVinculo.Value));
            vinculosQuery = AplicarEscopo(vinculosQuery, escopoPapel);
        }
        var vinculos = await vinculosQuery.ToListAsync(ct);
        var papeis = await _db.PapelVinculo.AsNoTracking()
            .Where(p => p.CodigoPapelVinculo != null)
            .ToDictionaryAsync(p => p.CodigoPapelVinculo!.Value, p => p.Descricao ?? p.CodigoPapelVinculo.ToString()!, ct);
        var unidadeIds = vinculos.Where(v => v.IdUnidade != null).Select(v => v.IdUnidade!.Value).Distinct().ToList();
        var unidades = unidadeIds.Count == 0
            ? new Dictionary<uint, string>()
            : await _db.Unidade.AsNoTracking()
                .Where(u => u.IdUnidade != null && unidadeIds.Contains(u.IdUnidade.Value))
                .ToDictionaryAsync(u => u.IdUnidade!.Value, u => u.Numero != null ? $"Unidade {u.Numero}" : $"Unidade {u.IdUnidade}", ct);

        var itens = new List<PessoaListagemItemDto>();
        var listarPorVinculoGestor = EhGestoresUnificado(codigosPapel);
        if (listarPorVinculoGestor)
        {
            foreach (var v in vinculos.Where(v => v.IdPessoa != null && v.CodigoPapelVinculo != null)
                         .OrderBy(v => v.IdPessoa).ThenByDescending(v => Vigente(v, hoje)).ThenBy(v => v.CodigoPapelVinculo))
            {
                var id = v.IdPessoa!.Value;
                var p = pessoas.FirstOrDefault(x => x.IdPessoa == id);
                if (p is null) continue;

                var ehPj = pjRows.ContainsKey(id);
                var ehPf = pfRows.ContainsKey(id);
                var tipoPessoa = ehPj ? "PJ" : ehPf ? "PF" : "—";
                if (!string.IsNullOrWhiteSpace(tipo))
                {
                    var t = tipo.Trim().ToUpperInvariant();
                    if (t == "PF" && !ehPf) continue;
                    if (t == "PJ" && !ehPj) continue;
                }

                var ativoVinculo = Vigente(v, hoje);
                if (vigente == true && !ativoVinculo) continue;
                if (vigente == false && ativoVinculo) continue;

                var situacaoLabel = ativoVinculo ? "Ativo" : "Encerrado";
                if (!string.IsNullOrWhiteSpace(situacao))
                {
                    var s = situacao.Trim().ToLowerInvariant();
                    if (s == "ativo" && !ativoVinculo) continue;
                    if (s == "encerrado" && ativoVinculo) continue;
                }

                var codPapel = v.CodigoPapelVinculo!.Value;
                string? complemento = ehPj
                    ? pjRows.GetValueOrDefault(id)?.NomeFantasia
                    : pfRows.GetValueOrDefault(id)?.Email;

                itens.Add(new PessoaListagemItemDto(
                    id,
                    tipoPessoa,
                    p.Nome ?? $"Pessoa {id}",
                    p.CPFCNPJ,
                    complemento,
                    situacaoLabel,
                    null,
                    null,
                    v.IdVinculo,
                    codPapel,
                    null,
                    null));
            }

            itens = itens.OrderBy(i => i.Nome).ThenBy(i => i.CodigoPapelVinculo).ToList();
            var totalGestor = itens.Count;
            var pageGestor = itens.Skip((page - 1) * pageSize).Take(pageSize).ToList();
            return new PagedResult<PessoaListagemItemDto>
            {
                Items = pageGestor,
                TotalCount = totalGestor,
                Page = page,
                PageSize = pageSize
            };
        }

        foreach (var p in pessoas)
        {
            var id = p.IdPessoa!.Value;
            var ehPj = pjRows.ContainsKey(id);
            var ehPf = pfRows.ContainsKey(id);
            var tipoPessoa = ehPj ? "PJ" : ehPf ? "PF" : "—";
            if (!string.IsNullOrWhiteSpace(tipo))
            {
                var t = tipo.Trim().ToUpperInvariant();
                if (t == "PF" && !ehPf) continue;
                if (t == "PJ" && !ehPj) continue;
            }

            var ativo = vinculos.Any(v =>
                v.IdPessoa == id
                && v.DataInicio <= hoje
                && (v.DataFim == null || v.DataFim >= hoje));
            var somenteHistorico = vinculos.Any(v => v.IdPessoa == id)
                && !ativo;

            string situacaoLabel;
            if (ativo) situacaoLabel = "Ativo";
            else if (somenteHistorico) situacaoLabel = "Encerrado";
            else situacaoLabel = "Sem vínculo ativo";

            if (!string.IsNullOrWhiteSpace(situacao))
            {
                var s = situacao.Trim().ToLowerInvariant();
                if (s == "ativo" && !ativo) continue;
                if (s == "encerrado" && ativo) continue;
                if (s == "encerrado" && !somenteHistorico && !ativo) continue;
            }

            string? complemento = ehPj
                ? pjRows[id].NomeFantasia
                : pfRows.GetValueOrDefault(id)?.Email;

            var principais = vinculos.Where(v => v.IdPessoa == id).ToList();
            bool Vigente(PessoaVinculo v) => v.DataInicio <= hoje && (v.DataFim == null || v.DataFim >= hoje);
            var principal = principais.FirstOrDefault(Vigente) ?? principais.FirstOrDefault();

            string? papelResumo = null;
            string? unidadeResumo = null;
            string? tipoOcupacaoResumo = null;
            bool? moradorAtivo = null;
            uint? codigoPapelLista = principal?.CodigoPapelVinculo;

            if (EhGestoresUnificado(codigosPapel))
            {
                var gestor = ResolverVinculoGestorPrincipal(principais, hoje);
                if (gestor?.CodigoPapelVinculo is uint codGestor)
                {
                    codigoPapelLista = codGestor;
                    principal = gestor;
                }
            }
            else if (EhOcupanteUnificado(codigosPapel))
            {
                moradorAtivo = principais.Any(v =>
                    v.CodigoPapelVinculo == PapelVinculoCodigos.Morador && Vigente(v));
                var tipoCod = ResolverTipoOcupacaoCodigo(principais, hoje);
                if (tipoCod is uint codTipo)
                {
                    codigoPapelLista = codTipo;
                    tipoOcupacaoResumo = papeis.GetValueOrDefault(codTipo) ?? codTipo.ToString();
                }
                var refUnidade = principais.FirstOrDefault(v => v.IdUnidade != null);
                if (refUnidade?.IdUnidade is uint idUnOcup)
                    unidadeResumo = unidades.GetValueOrDefault(idUnOcup);
                principal = principais.FirstOrDefault(v => v.CodigoPapelVinculo == tipoCod && Vigente(v))
                    ?? principais.FirstOrDefault(v => v.CodigoPapelVinculo == tipoCod)
                    ?? principal;
            }
            else if (principal?.CodigoPapelVinculo is uint codPapel)
            {
                papelResumo = papeis.GetValueOrDefault(codPapel) ?? codPapel.ToString();
            }

            uint? idVinculo = principal?.IdVinculo;
            if (principal?.IdUnidade is uint idUnidade)
                unidadeResumo ??= unidades.GetValueOrDefault(idUnidade);

            itens.Add(new PessoaListagemItemDto(
                id,
                tipoPessoa,
                p.Nome ?? $"Pessoa {id}",
                p.CPFCNPJ,
                complemento,
                situacaoLabel,
                papelResumo,
                unidadeResumo,
                idVinculo,
                codigoPapelLista,
                tipoOcupacaoResumo,
                moradorAtivo));
        }

        var total = itens.Count;
        var pageItems = itens.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        return new PagedResult<PessoaListagemItemDto>
        {
            Items = pageItems,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<PessoaPorDocumentoDto?> ObterPorDocumentoAsync(string cpfcnpj, bool permitirCadastroGlobal, CancellationToken ct = default)
    {
        var doc = DocumentoValidator.NormalizarCpfCnpj(cpfcnpj);
        if (string.IsNullOrEmpty(doc)) return null;

        var pessoa = await _db.Pessoa.IgnoreQueryFilters().AsNoTracking()
            .FirstOrDefaultAsync(p => p.CPFCNPJ == doc, ct);
        if (pessoa?.IdPessoa is not uint id) return null;

        if (!permitirCadastroGlobal)
        {
            var visivel = await _db.Pessoa.AsNoTracking().AnyAsync(p => p.IdPessoa == id, ct);
            if (!visivel) return null;
        }

        var pj = await _db.PessoaJuridica.IgnoreQueryFilters().AsNoTracking().FirstOrDefaultAsync(p => p.IdPessoa == id, ct);
        if (pj is not null)
        {
            return new PessoaPorDocumentoDto(
                id, true, pessoa.Nome, pessoa.CPFCNPJ, pessoa.Telefone,
                null, pj.NomeFantasia, null, pj.DataFundacao?.ToString("yyyy-MM-dd"), pj.IdResponsavel);
        }

        var pf = await _db.Pessoafisica.IgnoreQueryFilters().AsNoTracking().FirstOrDefaultAsync(p => p.IdPessoa == id, ct);
        if (pf is null) return null;

        return new PessoaPorDocumentoDto(
            id, false, pessoa.Nome, pessoa.CPFCNPJ, pessoa.Telefone,
            pf.Email, null, pf.DataNascimento?.ToString("yyyy-MM-dd"), null, null);
    }

    private static bool Vigente(PessoaVinculo v, DateOnly hoje) =>
        v.DataInicio <= hoje && (v.DataFim == null || v.DataFim >= hoje);

    private static bool EhGestoresUnificado(IReadOnlyCollection<uint>? codigos) =>
        codigos is { Count: >= 4 }
        && codigos.Contains(PapelVinculoCodigos.Sindico)
        && codigos.Contains(PapelVinculoCodigos.Subsindico)
        && codigos.Contains(PapelVinculoCodigos.Conselheiro)
        && codigos.Contains(PapelVinculoCodigos.Administradora);

    private static PessoaVinculo? ResolverVinculoGestorPrincipal(IEnumerable<PessoaVinculo> vinculos, DateOnly hoje)
    {
        uint[] ordem =
        [
            PapelVinculoCodigos.Sindico,
            PapelVinculoCodigos.Subsindico,
            PapelVinculoCodigos.Conselheiro,
            PapelVinculoCodigos.Administradora
        ];
        foreach (var cod in ordem)
        {
            var vigente = vinculos.FirstOrDefault(v => v.CodigoPapelVinculo == cod && Vigente(v, hoje));
            if (vigente is not null) return vigente;
        }
        foreach (var cod in ordem)
        {
            var qualquer = vinculos.FirstOrDefault(v => v.CodigoPapelVinculo == cod);
            if (qualquer is not null) return qualquer;
        }
        return null;
    }

    private static bool EhOcupanteUnificado(IReadOnlyCollection<uint>? codigos) =>
        codigos is { Count: >= 4 }
        && codigos.Contains(PapelVinculoCodigos.Proprietario)
        && codigos.Contains(PapelVinculoCodigos.Morador)
        && codigos.Contains(PapelVinculoCodigos.Locatario)
        && codigos.Contains(PapelVinculoCodigos.DependenteUnidade);

    private static uint? ResolverTipoOcupacaoCodigo(IEnumerable<PessoaVinculo> vinculos, DateOnly hoje)
    {
        bool Vigente(PessoaVinculo v) => v.DataInicio <= hoje && (v.DataFim == null || v.DataFim >= hoje);
        uint[] ordem =
        [
            PapelVinculoCodigos.DependenteUnidade,
            PapelVinculoCodigos.Proprietario,
            PapelVinculoCodigos.Locatario
        ];
        foreach (var cod in ordem)
        {
            if (vinculos.Any(v => v.CodigoPapelVinculo == cod && Vigente(v)))
                return cod;
        }
        foreach (var cod in ordem)
        {
            if (vinculos.Any(v => v.CodigoPapelVinculo == cod))
                return cod;
        }
        return null;
    }

    private static IQueryable<PessoaVinculo> AplicarEscopo(IQueryable<PessoaVinculo> query, string? escopoPapel)
    {
        var escopo = escopoPapel?.Trim().ToLowerInvariant();
        return escopo switch
        {
            "unidade" => query.Where(v => v.IdUnidade != null),
            "condominio" => query.Where(v => v.IdUnidade == null && v.IdPessoaRelacionada == null),
            "pessoa" => query.Where(v => v.IdPessoaRelacionada != null),
            _ => query
        };
    }
}