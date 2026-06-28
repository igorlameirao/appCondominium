using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class OfertaConcorrenciaRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public OfertaConcorrenciaRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<OfertaConcorrencia> BaseQuery() => _ctx.Set<OfertaConcorrencia>();

    private IQueryable<OfertaConcorrencia> ApplyCondominioFilter(IQueryable<OfertaConcorrencia> query)
    {
        if (_condominio.IdCondominio.HasValue)
            query = query.Where(e => e.IdCondominio == _condominio.IdCondominio.Value);
        return query;
    }

    public async Task<PagedResult<OfertaConcorrencia>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        if (!string.IsNullOrWhiteSpace(filter) && filter.Length >= 3)
            query = query.Where(e => (e.Descricao != null && e.Descricao.Contains(filter)) || (e.Justificativa != null && e.Justificativa.Contains(filter)));

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<OfertaConcorrencia> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<OfertaConcorrencia?> GetByIdAsync(uint? idOfertaConcorrencia, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdOfertaConcorrencia == idOfertaConcorrencia, ct);
    }

    public async Task<OfertaConcorrencia> AddAsync(OfertaConcorrencia entity, CancellationToken ct = default)
    {

        if (_condominio.IdCondominio.HasValue)
            entity.IdCondominio = _condominio.IdCondominio.Value;

        await _ctx.Set<OfertaConcorrencia>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(OfertaConcorrencia entity, CancellationToken ct = default)
    {
        _ctx.Set<OfertaConcorrencia>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idOfertaConcorrencia, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idOfertaConcorrencia, ct);
        if (e == null) return false;
        _ctx.Set<OfertaConcorrencia>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
