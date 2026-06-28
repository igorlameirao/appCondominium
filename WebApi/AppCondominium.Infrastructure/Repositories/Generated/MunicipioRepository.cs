using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class MunicipioRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public MunicipioRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<Municipio> BaseQuery() => _ctx.Set<Municipio>();

    private IQueryable<Municipio> ApplyCondominioFilter(IQueryable<Municipio> query)
    {
        return query;
    }

    public async Task<PagedResult<Municipio>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        if (!string.IsNullOrWhiteSpace(filter) && filter.Length >= 3)
            query = query.Where(e => (e.Nome != null && e.Nome.Contains(filter)) || (e.SiglaUF != null && e.SiglaUF.Contains(filter)));

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<Municipio> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<Municipio?> GetByIdAsync(uint? codigoIBGEMunicipio, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.CodigoIBGEMunicipio == codigoIBGEMunicipio, ct);
    }

    public async Task<Municipio> AddAsync(Municipio entity, CancellationToken ct = default)
    {

        await _ctx.Set<Municipio>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(Municipio entity, CancellationToken ct = default)
    {
        _ctx.Set<Municipio>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? codigoIBGEMunicipio, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(codigoIBGEMunicipio, ct);
        if (e == null) return false;
        _ctx.Set<Municipio>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
