using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class DadosBancariosRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public DadosBancariosRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<DadosBancarios> BaseQuery() => _ctx.Set<DadosBancarios>();

    private IQueryable<DadosBancarios> ApplyCondominioFilter(IQueryable<DadosBancarios> query)
    {
        if (_condominio.IdCondominio.HasValue)
            query = query.Where(e => e.IdCondominio == _condominio.IdCondominio.Value);
        return query;
    }

    public async Task<PagedResult<DadosBancarios>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        if (!string.IsNullOrWhiteSpace(filter) && filter.Length >= 3)
            query = query.Where(e => (e.Agencia != null && e.Agencia.Contains(filter)));

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<DadosBancarios> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<DadosBancarios?> GetByIdAsync(uint? conta, uint? codigoBanco, string? agencia, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.Conta == conta && e.CodigoBanco == codigoBanco && e.Agencia == agencia, ct);
    }

    public async Task<DadosBancarios> AddAsync(DadosBancarios entity, CancellationToken ct = default)
    {

        if (_condominio.IdCondominio.HasValue)
            entity.IdCondominio = _condominio.IdCondominio.Value;

        await _ctx.Set<DadosBancarios>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(DadosBancarios entity, CancellationToken ct = default)
    {
        _ctx.Set<DadosBancarios>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? conta, uint? codigoBanco, string? agencia, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(conta, codigoBanco, agencia, ct);
        if (e == null) return false;
        _ctx.Set<DadosBancarios>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
