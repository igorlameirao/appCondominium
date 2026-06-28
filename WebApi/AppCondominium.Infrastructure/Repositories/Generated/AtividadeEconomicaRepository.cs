using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class AtividadeEconomicaRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public AtividadeEconomicaRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<AtividadeEconomica> BaseQuery() => _ctx.Set<AtividadeEconomica>();

    private IQueryable<AtividadeEconomica> ApplyCondominioFilter(IQueryable<AtividadeEconomica> query)
    {
        return query;
    }

    public async Task<PagedResult<AtividadeEconomica>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        if (!string.IsNullOrWhiteSpace(filter) && filter.Length >= 3)
            query = query.Where(e => (e.Descricao != null && e.Descricao.Contains(filter)));

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<AtividadeEconomica> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<AtividadeEconomica?> GetByIdAsync(uint? codigoTipoAtividadeEconomica, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.CodigoTipoAtividadeEconomica == codigoTipoAtividadeEconomica, ct);
    }

    public async Task<AtividadeEconomica> AddAsync(AtividadeEconomica entity, CancellationToken ct = default)
    {

        await _ctx.Set<AtividadeEconomica>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(AtividadeEconomica entity, CancellationToken ct = default)
    {
        _ctx.Set<AtividadeEconomica>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? codigoTipoAtividadeEconomica, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(codigoTipoAtividadeEconomica, ct);
        if (e == null) return false;
        _ctx.Set<AtividadeEconomica>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
