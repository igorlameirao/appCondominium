using AppCondominium.Application.Common;
using AppCondominium.Application.DTOs;
using AppCondominium.Application.Interfaces;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.Infrastructure.Services;

public class FornecedorConsultaService : IFornecedorConsultaService
{
    private readonly AppDbContext _db;
    private readonly ICondominioContext _condominio;

    public FornecedorConsultaService(AppDbContext db, ICondominioContext condominio)
    {
        _db = db;
        _condominio = condominio;
    }

    public async Task<PagedResult<FornecedorListagemItemDto>> ListarAsync(
        int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var tenantId = _condominio.RequireTenantId();

        var query =
            from f in _db.Fornecedor.AsNoTracking()
            join p in _db.Pessoa.AsNoTracking() on f.IdPessoa equals p.IdPessoa
            where f.IdCondominio == tenantId
            select new { f, p };

        if (!string.IsNullOrWhiteSpace(filter) && filter.Trim().Length >= 3)
        {
            var f = filter.Trim();
            query = query.Where(x =>
                (x.p.Nome != null && x.p.Nome.Contains(f))
                || (x.p.CPFCNPJ != null && x.p.CPFCNPJ.Contains(f)));
        }

        var total = await query.CountAsync(ct);
        var rows = await query
            .OrderBy(x => x.p.Nome)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = rows.Select(x => new FornecedorListagemItemDto(
            x.f.IdFornecedor!.Value,
            x.f.IdPessoa!.Value,
            x.p.Nome ?? $"Fornecedor {x.f.IdFornecedor}",
            x.p.CPFCNPJ,
            x.f.Ativo == 1)).ToList();

        return new PagedResult<FornecedorListagemItemDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }
}