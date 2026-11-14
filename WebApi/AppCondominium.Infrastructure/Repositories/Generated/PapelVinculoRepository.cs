using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class PapelVinculoRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public PapelVinculoRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<PapelVinculo> BaseQuery() => _ctx.Set<PapelVinculo>();

    private IQueryable<PapelVinculo> ApplyCondominioFilter(IQueryable<PapelVinculo> query)
    {
        return query;
    }

    public async Task<PagedResult<PapelVinculo>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        if (!string.IsNullOrWhiteSpace(filter) && filter.Length >= 3)
            query = query.Where(e => (e.Descricao != null && e.Descricao.Contains(filter)));

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<PapelVinculo> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<PapelVinculo?> GetByIdAsync(uint? codigoPapelVinculo, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.CodigoPapelVinculo == codigoPapelVinculo, ct);
    }

    public async Task<PapelVinculo> AddAsync(PapelVinculo entity, CancellationToken ct = default)
    {

        await _ctx.Set<PapelVinculo>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(PapelVinculo entity, CancellationToken ct = default)
    {
        _ctx.Set<PapelVinculo>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? codigoPapelVinculo, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(codigoPapelVinculo, ct);
        if (e == null) return false;
        _ctx.Set<PapelVinculo>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
