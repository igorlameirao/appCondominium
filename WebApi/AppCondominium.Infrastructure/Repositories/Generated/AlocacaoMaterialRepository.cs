using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class AlocacaoMaterialRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public AlocacaoMaterialRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<AlocacaoMaterial> BaseQuery() => _ctx.Set<AlocacaoMaterial>();

    private IQueryable<AlocacaoMaterial> ApplyCondominioFilter(IQueryable<AlocacaoMaterial> query)
    {
        if (_condominio.IdCondominio.HasValue)
            query = query.Where(e => e.IdCondominio == _condominio.IdCondominio.Value);
        return query;
    }

    public async Task<PagedResult<AlocacaoMaterial>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<AlocacaoMaterial> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<AlocacaoMaterial?> GetByIdAsync(uint? idAlocacaoMaterial, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdAlocacaoMaterial == idAlocacaoMaterial, ct);
    }

    public async Task<AlocacaoMaterial> AddAsync(AlocacaoMaterial entity, CancellationToken ct = default)
    {

        if (_condominio.IdCondominio.HasValue)
            entity.IdCondominio = _condominio.IdCondominio.Value;

        await _ctx.Set<AlocacaoMaterial>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(AlocacaoMaterial entity, CancellationToken ct = default)
    {
        _ctx.Set<AlocacaoMaterial>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idAlocacaoMaterial, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idAlocacaoMaterial, ct);
        if (e == null) return false;
        _ctx.Set<AlocacaoMaterial>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
