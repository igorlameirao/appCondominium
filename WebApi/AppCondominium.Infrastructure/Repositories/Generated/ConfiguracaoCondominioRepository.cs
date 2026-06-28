using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class ConfiguracaoCondominioRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public ConfiguracaoCondominioRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<ConfiguracaoCondominio> BaseQuery() => _ctx.Set<ConfiguracaoCondominio>();

    private IQueryable<ConfiguracaoCondominio> ApplyCondominioFilter(IQueryable<ConfiguracaoCondominio> query)
    {
        if (_condominio.IdCondominio.HasValue)
            query = query.Where(e => e.IdCondominio == _condominio.IdCondominio.Value);
        return query;
    }

    public async Task<PagedResult<ConfiguracaoCondominio>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<ConfiguracaoCondominio> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<ConfiguracaoCondominio?> GetByIdAsync(uint? idConfiguracao, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdConfiguracao == idConfiguracao, ct);
    }

    public async Task<ConfiguracaoCondominio> AddAsync(ConfiguracaoCondominio entity, CancellationToken ct = default)
    {

        if (_condominio.IdCondominio.HasValue)
            entity.IdCondominio = _condominio.IdCondominio.Value;

        await _ctx.Set<ConfiguracaoCondominio>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(ConfiguracaoCondominio entity, CancellationToken ct = default)
    {
        _ctx.Set<ConfiguracaoCondominio>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idConfiguracao, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idConfiguracao, ct);
        if (e == null) return false;
        _ctx.Set<ConfiguracaoCondominio>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
