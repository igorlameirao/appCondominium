using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class CobrancaRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public CobrancaRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<Cobranca> BaseQuery() => _ctx.Set<Cobranca>();

    private IQueryable<Cobranca> ApplyCondominioFilter(IQueryable<Cobranca> query)
    {
        if (_condominio.IdCondominio.HasValue)
            query = query.Where(e => e.IdCondominio == _condominio.IdCondominio.Value);
        return query;
    }

    public async Task<PagedResult<Cobranca>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<Cobranca> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<Cobranca?> GetByIdAsync(ulong? idCobranca, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdCobranca == idCobranca, ct);
    }

    public async Task<Cobranca> AddAsync(Cobranca entity, CancellationToken ct = default)
    {

        if (_condominio.IdCondominio.HasValue)
            entity.IdCondominio = _condominio.IdCondominio.Value;

        await _ctx.Set<Cobranca>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(Cobranca entity, CancellationToken ct = default)
    {
        _ctx.Set<Cobranca>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(ulong? idCobranca, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idCobranca, ct);
        if (e == null) return false;
        _ctx.Set<Cobranca>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
