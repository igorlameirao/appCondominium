using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class PessoaVinculoRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public PessoaVinculoRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<PessoaVinculo> BaseQuery() => _ctx.Set<PessoaVinculo>();

    private IQueryable<PessoaVinculo> ApplyCondominioFilter(IQueryable<PessoaVinculo> query)
    {
        var tenantId = _condominio.RequireTenantId();
        query = query.Where(e => e.IdCondominio == tenantId);
        return query;
    }

    public async Task<PagedResult<PessoaVinculo>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<PessoaVinculo> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<PessoaVinculo?> GetByIdAsync(uint? idVinculo, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdVinculo == idVinculo, ct);
    }

    public async Task<PessoaVinculo> AddAsync(PessoaVinculo entity, CancellationToken ct = default)
    {
        var tenantId = _condominio.RequireTenantId();
        entity.IdCondominio = tenantId;

        await _ctx.Set<PessoaVinculo>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(PessoaVinculo entity, CancellationToken ct = default)
    {
        var tenantId = _condominio.RequireTenantId();
        entity.IdCondominio = tenantId;
        _ctx.Set<PessoaVinculo>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idVinculo, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idVinculo, ct);
        if (e == null) return false;
        _ctx.Set<PessoaVinculo>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
