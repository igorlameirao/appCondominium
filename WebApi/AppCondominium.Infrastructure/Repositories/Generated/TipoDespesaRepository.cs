using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class TipoDespesaRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public TipoDespesaRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<TipoDespesa> BaseQuery() => _ctx.Set<TipoDespesa>();

    private IQueryable<TipoDespesa> ApplyCondominioFilter(IQueryable<TipoDespesa> query)
    {
        if (_condominio.IdCondominio.HasValue)
            query = query.Where(e => e.IdCondominio == _condominio.IdCondominio.Value);
        return query;
    }

    public async Task<PagedResult<TipoDespesa>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        if (!string.IsNullOrWhiteSpace(filter) && filter.Length >= 3)
            query = query.Where(e => (e.Descricao != null && e.Descricao.Contains(filter)) || (e.CodigoContabil != null && e.CodigoContabil.Contains(filter)));

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<TipoDespesa> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<TipoDespesa?> GetByIdAsync(uint? idTipoDespesa, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdTipoDespesa == idTipoDespesa, ct);
    }

    public async Task<TipoDespesa> AddAsync(TipoDespesa entity, CancellationToken ct = default)
    {

        if (_condominio.IdCondominio.HasValue)
            entity.IdCondominio = _condominio.IdCondominio.Value;

        await _ctx.Set<TipoDespesa>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(TipoDespesa entity, CancellationToken ct = default)
    {
        _ctx.Set<TipoDespesa>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idTipoDespesa, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idTipoDespesa, ct);
        if (e == null) return false;
        _ctx.Set<TipoDespesa>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
