using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class DespesaRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public DespesaRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<Despesa> BaseQuery() => _ctx.Set<Despesa>();

    private IQueryable<Despesa> ApplyCondominioFilter(IQueryable<Despesa> query)
    {
        if (_condominio.IdCondominio.HasValue)
            query = query.Where(e => e.IdCondominio == _condominio.IdCondominio.Value);
        return query;
    }

    public async Task<PagedResult<Despesa>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        if (!string.IsNullOrWhiteSpace(filter) && filter.Length >= 3)
            query = query.Where(e => (e.Descricao != null && e.Descricao.Contains(filter)) || (e.Observacoes != null && e.Observacoes.Contains(filter)));

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<Despesa> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<Despesa?> GetByIdAsync(ulong? idDespesa, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdDespesa == idDespesa, ct);
    }

    public async Task<Despesa> AddAsync(Despesa entity, CancellationToken ct = default)
    {

        if (_condominio.IdCondominio.HasValue)
            entity.IdCondominio = _condominio.IdCondominio.Value;

        await _ctx.Set<Despesa>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(Despesa entity, CancellationToken ct = default)
    {
        _ctx.Set<Despesa>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(ulong? idDespesa, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idDespesa, ct);
        if (e == null) return false;
        _ctx.Set<Despesa>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
