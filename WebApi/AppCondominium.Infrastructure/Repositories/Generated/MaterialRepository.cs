using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class MaterialRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public MaterialRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<Material> BaseQuery() => _ctx.Set<Material>();

    private IQueryable<Material> ApplyCondominioFilter(IQueryable<Material> query)
    {
        var tenantId = _condominio.RequireTenantId();
        query = query.Where(e => e.IdCondominio == tenantId);
        return query;
    }

    public async Task<PagedResult<Material>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<Material> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<Material?> GetByIdAsync(uint? idMaterial, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdMaterial == idMaterial, ct);
    }

    public async Task<Material> AddAsync(Material entity, CancellationToken ct = default)
    {
        var tenantId = _condominio.RequireTenantId();
        entity.IdCondominio = tenantId;

        await _ctx.Set<Material>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(Material entity, CancellationToken ct = default)
    {
        var tenantId = _condominio.RequireTenantId();
        entity.IdCondominio = tenantId;
        _ctx.Set<Material>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idMaterial, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idMaterial, ct);
        if (e == null) return false;
        _ctx.Set<Material>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
