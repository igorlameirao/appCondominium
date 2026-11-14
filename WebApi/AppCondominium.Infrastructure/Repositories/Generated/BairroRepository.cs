using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class BairroRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public BairroRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<Bairro> BaseQuery() => _ctx.Set<Bairro>();

    private IQueryable<Bairro> ApplyCondominioFilter(IQueryable<Bairro> query)
    {
        return query;
    }

    public async Task<PagedResult<Bairro>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        if (!string.IsNullOrWhiteSpace(filter) && filter.Length >= 3)
            query = query.Where(e => (e.Nome != null && e.Nome.Contains(filter)));

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<Bairro> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<Bairro?> GetByIdAsync(uint? idBairro, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdBairro == idBairro, ct);
    }

    public async Task<Bairro> AddAsync(Bairro entity, CancellationToken ct = default)
    {

        await _ctx.Set<Bairro>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(Bairro entity, CancellationToken ct = default)
    {
        _ctx.Set<Bairro>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idBairro, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idBairro, ct);
        if (e == null) return false;
        _ctx.Set<Bairro>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
