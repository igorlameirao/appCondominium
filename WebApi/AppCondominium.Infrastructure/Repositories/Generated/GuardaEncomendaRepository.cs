using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class GuardaEncomendaRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public GuardaEncomendaRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<GuardaEncomenda> BaseQuery() => _ctx.Set<GuardaEncomenda>();

    private IQueryable<GuardaEncomenda> ApplyCondominioFilter(IQueryable<GuardaEncomenda> query)
    {
        if (_condominio.IdCondominio.HasValue)
            query = query.Where(e => e.IdCondominio == _condominio.IdCondominio.Value);
        return query;
    }

    public async Task<PagedResult<GuardaEncomenda>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        if (!string.IsNullOrWhiteSpace(filter) && filter.Length >= 3)
            query = query.Where(e => (e.CodigoEncomenda != null && e.CodigoEncomenda.Contains(filter)));

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<GuardaEncomenda> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<GuardaEncomenda?> GetByIdAsync(ulong? idGuardaEncomenda, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdGuardaEncomenda == idGuardaEncomenda, ct);
    }

    public async Task<GuardaEncomenda> AddAsync(GuardaEncomenda entity, CancellationToken ct = default)
    {

        if (_condominio.IdCondominio.HasValue)
            entity.IdCondominio = _condominio.IdCondominio.Value;

        await _ctx.Set<GuardaEncomenda>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(GuardaEncomenda entity, CancellationToken ct = default)
    {
        _ctx.Set<GuardaEncomenda>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(ulong? idGuardaEncomenda, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idGuardaEncomenda, ct);
        if (e == null) return false;
        _ctx.Set<GuardaEncomenda>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
