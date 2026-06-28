using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class EntradaSaidaMaterialConsumoRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public EntradaSaidaMaterialConsumoRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<EntradaSaidaMaterialConsumo> BaseQuery() => _ctx.Set<EntradaSaidaMaterialConsumo>();

    private IQueryable<EntradaSaidaMaterialConsumo> ApplyCondominioFilter(IQueryable<EntradaSaidaMaterialConsumo> query)
    {
        if (_condominio.IdCondominio.HasValue)
            query = query.Where(e => e.IdCondominio == _condominio.IdCondominio.Value);
        return query;
    }

    public async Task<PagedResult<EntradaSaidaMaterialConsumo>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<EntradaSaidaMaterialConsumo> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<EntradaSaidaMaterialConsumo?> GetByIdAsync(ulong? idEntradaSaidaMaterialConsumo, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdEntradaSaidaMaterialConsumo == idEntradaSaidaMaterialConsumo, ct);
    }

    public async Task<EntradaSaidaMaterialConsumo> AddAsync(EntradaSaidaMaterialConsumo entity, CancellationToken ct = default)
    {

        if (_condominio.IdCondominio.HasValue)
            entity.IdCondominio = _condominio.IdCondominio.Value;

        await _ctx.Set<EntradaSaidaMaterialConsumo>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(EntradaSaidaMaterialConsumo entity, CancellationToken ct = default)
    {
        _ctx.Set<EntradaSaidaMaterialConsumo>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(ulong? idEntradaSaidaMaterialConsumo, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idEntradaSaidaMaterialConsumo, ct);
        if (e == null) return false;
        _ctx.Set<EntradaSaidaMaterialConsumo>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
