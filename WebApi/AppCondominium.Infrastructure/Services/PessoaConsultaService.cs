using AppCondominium.Application.Common;
using AppCondominium.Application.DTOs;
using AppCondominium.Application.Interfaces;
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
        int page, int pageSize, string? filter, string? tipo, string? situacao, CancellationToken ct = default)
    {
        var tenantId = _condominio.RequireTenantId();
        var hoje = DateOnly.FromDateTime(DateTime.UtcNow);

        var idsVinculo = _db.PessoaVinculo.AsNoTracking()
            .Where(v => v.IdCondominio == tenantId)
            .Select(v => v.IdPessoa);
        var idsFornecedor = _db.Fornecedor.AsNoTracking()
            .Where(f => f.IdCondominio == tenantId)
            .Select(f => f.IdPessoa);

        var idsPessoa = await idsVinculo.Union(idsFornecedor).Distinct().ToListAsync(ct);
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

        var pfIds = await _db.Pessoafisica.AsNoTracking()
            .Where(p => ids.Contains(p.IdPessoa!.Value))
            .Select(p => p.IdPessoa!.Value)
            .ToListAsync(ct);
        var pjRows = await _db.PessoaJuridica.AsNoTracking()
            .Where(p => ids.Contains(p.IdPessoa!.Value))
            .ToDictionaryAsync(p => p.IdPessoa!.Value, ct);
        var pfRows = await _db.Pessoafisica.AsNoTracking()
            .Where(p => ids.Contains(p.IdPessoa!.Value))
            .ToDictionaryAsync(p => p.IdPessoa!.Value, ct);

        var vinculos = await _db.PessoaVinculo.AsNoTracking()
            .Where(v => v.IdCondominio == tenantId && ids.Contains(v.IdPessoa!.Value))
            .ToListAsync(ct);

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

            itens.Add(new PessoaListagemItemDto(
                id,
                tipoPessoa,
                p.Nome ?? $"Pessoa {id}",
                p.CPFCNPJ,
                complemento,
                situacaoLabel));
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
}