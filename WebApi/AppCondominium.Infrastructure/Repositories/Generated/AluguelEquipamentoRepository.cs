using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class AluguelEquipamentoRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public AluguelEquipamentoRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<AluguelEquipamento> BaseQuery() => _ctx.Set<AluguelEquipamento>();

    private IQueryable<AluguelEquipamento> ApplyCondominioFilter(IQueryable<AluguelEquipamento> query)
    {
        if (_condominio.IdCondominio.HasValue)
            query = query.Where(e => e.IdCondominio == _condominio.IdCondominio.Value);
        return query;
    }

    public async Task<PagedResult<AluguelEquipamento>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<AluguelEquipamento> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<AluguelEquipamento?> GetByIdAsync(uint? idAluguelEquipamento, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdAluguelEquipamento == idAluguelEquipamento, ct);
    }

    public async Task<AluguelEquipamento> AddAsync(AluguelEquipamento entity, CancellationToken ct = default)
    {

        if (_condominio.IdCondominio.HasValue)
            entity.IdCondominio = _condominio.IdCondominio.Value;

        await _ctx.Set<AluguelEquipamento>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(AluguelEquipamento entity, CancellationToken ct = default)
    {
        _ctx.Set<AluguelEquipamento>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idAluguelEquipamento, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idAluguelEquipamento, ct);
        if (e == null) return false;
        _ctx.Set<AluguelEquipamento>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
