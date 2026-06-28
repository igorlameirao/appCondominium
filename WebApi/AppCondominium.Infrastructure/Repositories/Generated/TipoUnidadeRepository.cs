using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class TipoUnidadeRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public TipoUnidadeRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<TipoUnidade> BaseQuery() => _ctx.Set<TipoUnidade>();

    private IQueryable<TipoUnidade> ApplyCondominioFilter(IQueryable<TipoUnidade> query)
    {
        if (_condominio.IdCondominio.HasValue)
            query = query.Where(e => e.IdCondominio == _condominio.IdCondominio.Value);
        return query;
    }

    public async Task<PagedResult<TipoUnidade>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        if (!string.IsNullOrWhiteSpace(filter) && filter.Length >= 3)
            query = query.Where(e => (e.Descricao != null && e.Descricao.Contains(filter)));

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<TipoUnidade> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<TipoUnidade?> GetByIdAsync(uint? idTipoUnidade, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdTipoUnidade == idTipoUnidade, ct);
    }

    public async Task<TipoUnidade> AddAsync(TipoUnidade entity, CancellationToken ct = default)
    {

        if (_condominio.IdCondominio.HasValue)
            entity.IdCondominio = _condominio.IdCondominio.Value;

        await _ctx.Set<TipoUnidade>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(TipoUnidade entity, CancellationToken ct = default)
    {
        _ctx.Set<TipoUnidade>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idTipoUnidade, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idTipoUnidade, ct);
        if (e == null) return false;
        _ctx.Set<TipoUnidade>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
