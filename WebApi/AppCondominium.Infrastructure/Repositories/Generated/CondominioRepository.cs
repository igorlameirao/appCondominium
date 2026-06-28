using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class CondominioRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public CondominioRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<Condominio> BaseQuery() => _ctx.Set<Condominio>();

    private IQueryable<Condominio> ApplyCondominioFilter(IQueryable<Condominio> query)
    {
        return query;
    }

    public async Task<PagedResult<Condominio>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        if (!string.IsNullOrWhiteSpace(filter) && filter.Length >= 3)
            query = query.Where(e => (e.Nome != null && e.Nome.Contains(filter)));

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<Condominio> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<Condominio?> GetByIdAsync(uint? idCondominio, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdCondominio == idCondominio, ct);
    }

    public async Task<Condominio> AddAsync(Condominio entity, CancellationToken ct = default)
    {

        await _ctx.Set<Condominio>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(Condominio entity, CancellationToken ct = default)
    {
        _ctx.Set<Condominio>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idCondominio, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idCondominio, ct);
        if (e == null) return false;
        _ctx.Set<Condominio>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
