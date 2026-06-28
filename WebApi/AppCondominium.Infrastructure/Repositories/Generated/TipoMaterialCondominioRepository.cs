using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class TipoMaterialCondominioRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public TipoMaterialCondominioRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<TipoMaterialCondominio> BaseQuery() => _ctx.Set<TipoMaterialCondominio>();

    private IQueryable<TipoMaterialCondominio> ApplyCondominioFilter(IQueryable<TipoMaterialCondominio> query)
    {
        if (_condominio.IdCondominio.HasValue)
            query = query.Where(e => e.IdCondominio == _condominio.IdCondominio.Value);
        return query;
    }

    public async Task<PagedResult<TipoMaterialCondominio>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<TipoMaterialCondominio> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<TipoMaterialCondominio?> GetByIdAsync(uint? idTipoMaterial, uint? idCondominio, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdTipoMaterial == idTipoMaterial && e.IdCondominio == idCondominio, ct);
    }

    public async Task<TipoMaterialCondominio> AddAsync(TipoMaterialCondominio entity, CancellationToken ct = default)
    {

        if (_condominio.IdCondominio.HasValue)
            entity.IdCondominio = _condominio.IdCondominio.Value;

        await _ctx.Set<TipoMaterialCondominio>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(TipoMaterialCondominio entity, CancellationToken ct = default)
    {
        _ctx.Set<TipoMaterialCondominio>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idTipoMaterial, uint? idCondominio, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idTipoMaterial, idCondominio, ct);
        if (e == null) return false;
        _ctx.Set<TipoMaterialCondominio>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
