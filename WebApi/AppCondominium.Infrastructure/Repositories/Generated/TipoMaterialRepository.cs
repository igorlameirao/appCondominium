using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class TipoMaterialRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public TipoMaterialRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<TipoMaterial> BaseQuery() => _ctx.Set<TipoMaterial>();

    private IQueryable<TipoMaterial> ApplyCondominioFilter(IQueryable<TipoMaterial> query)
    {
        return query;
    }

    public async Task<PagedResult<TipoMaterial>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<TipoMaterial> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<TipoMaterial?> GetByIdAsync(uint? idTipoMaterial, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdTipoMaterial == idTipoMaterial, ct);
    }

    public async Task<TipoMaterial> AddAsync(TipoMaterial entity, CancellationToken ct = default)
    {

        await _ctx.Set<TipoMaterial>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(TipoMaterial entity, CancellationToken ct = default)
    {
        _ctx.Set<TipoMaterial>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idTipoMaterial, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idTipoMaterial, ct);
        if (e == null) return false;
        _ctx.Set<TipoMaterial>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
