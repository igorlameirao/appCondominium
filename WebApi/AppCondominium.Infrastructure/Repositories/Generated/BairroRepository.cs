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
        var items = await EnrichWithMunicipioNomeAsync(
            query.Skip((page - 1) * pageSize).Take(pageSize), ct);
        return new PagedResult<Bairro> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<Bairro?> GetByIdAsync(uint? idBairro, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery().AsNoTracking()).Where(e => e.IdBairro == idBairro);
        var items = await EnrichWithMunicipioNomeAsync(q, ct);
        return items.FirstOrDefault();
    }

    private async Task<List<Bairro>> EnrichWithMunicipioNomeAsync(IQueryable<Bairro> bairros, CancellationToken ct)
    {
        return await (
            from b in bairros
            join m in _ctx.Municipio.AsNoTracking() on b.CodigoIBGEMunicipio equals m.CodigoIBGEMunicipio into mg
            from m in mg.DefaultIfEmpty()
            select new Bairro
            {
                IdBairro = b.IdBairro,
                Nome = b.Nome,
                CodigoIBGEMunicipio = b.CodigoIBGEMunicipio,
                NomeMunicipio = m != null ? m.Nome : null
            }).ToListAsync(ct);
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
