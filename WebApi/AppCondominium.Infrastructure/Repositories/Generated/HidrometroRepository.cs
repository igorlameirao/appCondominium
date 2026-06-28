using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class HidrometroRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public HidrometroRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<Hidrometro> BaseQuery() => _ctx.Set<Hidrometro>();

    private IQueryable<Hidrometro> ApplyCondominioFilter(IQueryable<Hidrometro> query)
    {
        if (_condominio.IdCondominio.HasValue)
            query = query.Where(e => e.IdCondominio == _condominio.IdCondominio.Value);
        return query;
    }

    public async Task<PagedResult<Hidrometro>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        if (!string.IsNullOrWhiteSpace(filter) && filter.Length >= 3)
            query = query.Where(e => (e.NumeroSerie != null && e.NumeroSerie.Contains(filter)));

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<Hidrometro> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<Hidrometro?> GetByIdAsync(uint? idHidrometro, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdHidrometro == idHidrometro, ct);
    }

    public async Task<Hidrometro> AddAsync(Hidrometro entity, CancellationToken ct = default)
    {

        if (_condominio.IdCondominio.HasValue)
            entity.IdCondominio = _condominio.IdCondominio.Value;

        await _ctx.Set<Hidrometro>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(Hidrometro entity, CancellationToken ct = default)
    {
        _ctx.Set<Hidrometro>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idHidrometro, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idHidrometro, ct);
        if (e == null) return false;
        _ctx.Set<Hidrometro>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
