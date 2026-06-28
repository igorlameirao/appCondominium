using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class ConcorrenciaRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public ConcorrenciaRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<Concorrencia> BaseQuery() => _ctx.Set<Concorrencia>();

    private IQueryable<Concorrencia> ApplyCondominioFilter(IQueryable<Concorrencia> query)
    {
        if (_condominio.IdCondominio.HasValue)
            query = query.Where(e => e.IdCondominio == _condominio.IdCondominio.Value);
        return query;
    }

    public async Task<PagedResult<Concorrencia>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        if (!string.IsNullOrWhiteSpace(filter) && filter.Length >= 3)
            query = query.Where(e => (e.Descricao != null && e.Descricao.Contains(filter)));

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<Concorrencia> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<Concorrencia?> GetByIdAsync(uint? idConcorrencia, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdConcorrencia == idConcorrencia, ct);
    }

    public async Task<Concorrencia> AddAsync(Concorrencia entity, CancellationToken ct = default)
    {

        if (_condominio.IdCondominio.HasValue)
            entity.IdCondominio = _condominio.IdCondominio.Value;

        await _ctx.Set<Concorrencia>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(Concorrencia entity, CancellationToken ct = default)
    {
        _ctx.Set<Concorrencia>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idConcorrencia, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idConcorrencia, ct);
        if (e == null) return false;
        _ctx.Set<Concorrencia>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
