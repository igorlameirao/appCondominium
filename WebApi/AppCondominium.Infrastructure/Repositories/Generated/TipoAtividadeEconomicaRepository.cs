using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class TipoAtividadeEconomicaRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public TipoAtividadeEconomicaRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<TipoAtividadeEconomica> BaseQuery() => _ctx.Set<TipoAtividadeEconomica>();

    private IQueryable<TipoAtividadeEconomica> ApplyCondominioFilter(IQueryable<TipoAtividadeEconomica> query)
    {
        return query;
    }

    public async Task<PagedResult<TipoAtividadeEconomica>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        if (!string.IsNullOrWhiteSpace(filter) && filter.Length >= 3)
            query = query.Where(e => (e.Descricao != null && e.Descricao.Contains(filter)));

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<TipoAtividadeEconomica> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<TipoAtividadeEconomica?> GetByIdAsync(uint? codigoTipoAtividadeEconomica, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.CodigoTipoAtividadeEconomica == codigoTipoAtividadeEconomica, ct);
    }

    public async Task<TipoAtividadeEconomica> AddAsync(TipoAtividadeEconomica entity, CancellationToken ct = default)
    {

        await _ctx.Set<TipoAtividadeEconomica>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(TipoAtividadeEconomica entity, CancellationToken ct = default)
    {
        _ctx.Set<TipoAtividadeEconomica>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? codigoTipoAtividadeEconomica, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(codigoTipoAtividadeEconomica, ct);
        if (e == null) return false;
        _ctx.Set<TipoAtividadeEconomica>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
