using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class UFRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public UFRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<UF> BaseQuery() => _ctx.Set<UF>();

    private IQueryable<UF> ApplyCondominioFilter(IQueryable<UF> query)
    {
        return query;
    }

    public async Task<PagedResult<UF>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        if (!string.IsNullOrWhiteSpace(filter) && filter.Length >= 3)
            query = query.Where(e => (e.SiglaUF != null && e.SiglaUF.Contains(filter)) || (e.Estado != null && e.Estado.Contains(filter)));

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<UF> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<UF?> GetByIdAsync(string? siglaUF, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.SiglaUF == siglaUF, ct);
    }

    public async Task<UF> AddAsync(UF entity, CancellationToken ct = default)
    {

        await _ctx.Set<UF>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(UF entity, CancellationToken ct = default)
    {
        _ctx.Set<UF>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(string? siglaUF, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(siglaUF, ct);
        if (e == null) return false;
        _ctx.Set<UF>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
