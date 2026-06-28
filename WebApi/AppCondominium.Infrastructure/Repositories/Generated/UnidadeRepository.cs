using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class UnidadeRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public UnidadeRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<Unidade> BaseQuery() => _ctx.Set<Unidade>();

    private IQueryable<Unidade> ApplyCondominioFilter(IQueryable<Unidade> query)
    {
        if (_condominio.IdCondominio.HasValue)
            query = query.Where(e => e.IdCondominio == _condominio.IdCondominio.Value);
        return query;
    }

    public async Task<PagedResult<Unidade>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<Unidade> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<Unidade?> GetByIdAsync(uint? idUnidade, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdUnidade == idUnidade, ct);
    }

    public async Task<Unidade> AddAsync(Unidade entity, CancellationToken ct = default)
    {

        if (_condominio.IdCondominio.HasValue)
            entity.IdCondominio = _condominio.IdCondominio.Value;

        await _ctx.Set<Unidade>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(Unidade entity, CancellationToken ct = default)
    {
        _ctx.Set<Unidade>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idUnidade, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idUnidade, ct);
        if (e == null) return false;
        _ctx.Set<Unidade>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
