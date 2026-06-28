using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class ConsumoAguaRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public ConsumoAguaRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<ConsumoAgua> BaseQuery() => _ctx.Set<ConsumoAgua>();

    private IQueryable<ConsumoAgua> ApplyCondominioFilter(IQueryable<ConsumoAgua> query)
    {
        if (_condominio.IdCondominio.HasValue)
            query = query.Where(e => e.IdCondominio == _condominio.IdCondominio.Value);
        return query;
    }

    public async Task<PagedResult<ConsumoAgua>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        if (!string.IsNullOrWhiteSpace(filter) && filter.Length >= 3)
            query = query.Where(e => (e.MesReferencia != null && e.MesReferencia.Contains(filter)));

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<ConsumoAgua> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<ConsumoAgua?> GetByIdAsync(uint? idConsumo, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdConsumo == idConsumo, ct);
    }

    public async Task<ConsumoAgua> AddAsync(ConsumoAgua entity, CancellationToken ct = default)
    {

        if (_condominio.IdCondominio.HasValue)
            entity.IdCondominio = _condominio.IdCondominio.Value;

        await _ctx.Set<ConsumoAgua>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(ConsumoAgua entity, CancellationToken ct = default)
    {
        _ctx.Set<ConsumoAgua>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idConsumo, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idConsumo, ct);
        if (e == null) return false;
        _ctx.Set<ConsumoAgua>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
