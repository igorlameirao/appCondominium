using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class BancoRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public BancoRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<Banco> BaseQuery() => _ctx.Set<Banco>();

    private IQueryable<Banco> ApplyCondominioFilter(IQueryable<Banco> query)
    {
        return query;
    }

    public async Task<PagedResult<Banco>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        if (!string.IsNullOrWhiteSpace(filter) && filter.Length >= 3)
            query = query.Where(e => (e.Nome != null && e.Nome.Contains(filter)));

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<Banco> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<Banco?> GetByIdAsync(uint? codigoBanco, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.CodigoBanco == codigoBanco, ct);
    }

    public async Task<Banco> AddAsync(Banco entity, CancellationToken ct = default)
    {

        await _ctx.Set<Banco>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(Banco entity, CancellationToken ct = default)
    {
        _ctx.Set<Banco>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? codigoBanco, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(codigoBanco, ct);
        if (e == null) return false;
        _ctx.Set<Banco>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
