using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class LocalRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public LocalRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<Local> BaseQuery() => _ctx.Set<Local>();

    private IQueryable<Local> ApplyCondominioFilter(IQueryable<Local> query)
    {
        if (_condominio.IdCondominio.HasValue)
            query = query.Where(e => e.IdCondominio == _condominio.IdCondominio.Value);
        return query;
    }

    public async Task<PagedResult<Local>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<Local> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<Local?> GetByIdAsync(uint? idLocal, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdLocal == idLocal, ct);
    }

    public async Task<Local> AddAsync(Local entity, CancellationToken ct = default)
    {

        if (_condominio.IdCondominio.HasValue)
            entity.IdCondominio = _condominio.IdCondominio.Value;

        await _ctx.Set<Local>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(Local entity, CancellationToken ct = default)
    {
        _ctx.Set<Local>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idLocal, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idLocal, ct);
        if (e == null) return false;
        _ctx.Set<Local>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
