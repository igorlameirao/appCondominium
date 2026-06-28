using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class EquipamentoRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public EquipamentoRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<Equipamento> BaseQuery() => _ctx.Set<Equipamento>();

    private IQueryable<Equipamento> ApplyCondominioFilter(IQueryable<Equipamento> query)
    {
        if (_condominio.IdCondominio.HasValue)
            query = query.Where(e => e.IdCondominio == _condominio.IdCondominio.Value);
        return query;
    }

    public async Task<PagedResult<Equipamento>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        if (!string.IsNullOrWhiteSpace(filter) && filter.Length >= 3)
            query = query.Where(e => (e.Descricao != null && e.Descricao.Contains(filter)));

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<Equipamento> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<Equipamento?> GetByIdAsync(uint? idEquipamento, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdEquipamento == idEquipamento, ct);
    }

    public async Task<Equipamento> AddAsync(Equipamento entity, CancellationToken ct = default)
    {

        if (_condominio.IdCondominio.HasValue)
            entity.IdCondominio = _condominio.IdCondominio.Value;

        await _ctx.Set<Equipamento>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(Equipamento entity, CancellationToken ct = default)
    {
        _ctx.Set<Equipamento>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idEquipamento, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idEquipamento, ct);
        if (e == null) return false;
        _ctx.Set<Equipamento>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
