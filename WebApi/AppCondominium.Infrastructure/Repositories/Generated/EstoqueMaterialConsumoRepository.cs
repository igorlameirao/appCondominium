using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class EstoqueMaterialConsumoRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public EstoqueMaterialConsumoRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<EstoqueMaterialConsumo> BaseQuery() => _ctx.Set<EstoqueMaterialConsumo>();

    private IQueryable<EstoqueMaterialConsumo> ApplyCondominioFilter(IQueryable<EstoqueMaterialConsumo> query)
    {
        if (_condominio.IdCondominio.HasValue)
            query = query.Where(e => e.IdCondominio == _condominio.IdCondominio.Value);
        return query;
    }

    public async Task<PagedResult<EstoqueMaterialConsumo>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<EstoqueMaterialConsumo> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<EstoqueMaterialConsumo?> GetByIdAsync(uint? idEstoqueMaterialConsumo, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdEstoqueMaterialConsumo == idEstoqueMaterialConsumo, ct);
    }

    public async Task<EstoqueMaterialConsumo> AddAsync(EstoqueMaterialConsumo entity, CancellationToken ct = default)
    {

        if (_condominio.IdCondominio.HasValue)
            entity.IdCondominio = _condominio.IdCondominio.Value;

        await _ctx.Set<EstoqueMaterialConsumo>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(EstoqueMaterialConsumo entity, CancellationToken ct = default)
    {
        _ctx.Set<EstoqueMaterialConsumo>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idEstoqueMaterialConsumo, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idEstoqueMaterialConsumo, ct);
        if (e == null) return false;
        _ctx.Set<EstoqueMaterialConsumo>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
