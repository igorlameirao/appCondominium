using AppCondominium.Application.Common;
using AppCondominium.Application.DTOs;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Domain.Validators;
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
            var principal = principais.FirstOrDefault(v =>
                    v.DataInicio <= hoje && (v.DataFim == null || v.DataFim >= hoje))
                ?? principais.FirstOrDefault();
            string? papelResumo = null;
            string? unidadeResumo = null;
            uint? idVinculo = principal?.IdVinculo;
            if (principal?.CodigoPapelVinculo is uint codPapel)
                papelResumo = papeis.GetValueOrDefault(codPapel) ?? codPapel.ToString();
            if (principal?.IdUnidade is uint idUnidade)
                unidadeResumo = unidades.GetValueOrDefault(idUnidade);

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
                principal?.CodigoPapelVinculo));
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