using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.Infrastructure.Repositories;

public class FuncaoColaboradorRepository
{
    private readonly AppDbContext _ctx;

    public FuncaoColaboradorRepository(AppDbContext ctx) => _ctx = ctx;

    public async Task<PagedResult<FuncaoColaborador>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = _ctx.FuncaoColaborador.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(filter) && filter.Length >= 3)
            query = query.Where(e => e.Descricao != null && e.Descricao.Contains(filter));
        var total = await query.CountAsync(ct);
        var items = await query.OrderBy(e => e.Descricao).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<FuncaoColaborador> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public Task<FuncaoColaborador?> GetByIdAsync(uint id, CancellationToken ct = default) =>
        _ctx.FuncaoColaborador.FirstOrDefaultAsync(e => e.IdFuncaoColaborador == id, ct);

    public async Task<FuncaoColaborador> AddAsync(FuncaoColaborador entity, CancellationToken ct = default)
    {
        var desc = entity.Descricao?.Trim();
        if (string.IsNullOrWhiteSpace(desc))
            throw new InvalidOperationException("Descrição é obrigatória.");
        if (await _ctx.FuncaoColaborador.AnyAsync(e => e.Descricao == desc, ct))
            throw new InvalidOperationException("Já existe uma função com esta descrição.");
        entity.Descricao = desc;
        await _ctx.FuncaoColaborador.AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(FuncaoColaborador entity, CancellationToken ct = default)
    {
        var desc = entity.Descricao?.Trim();
        if (string.IsNullOrWhiteSpace(desc))
            throw new InvalidOperationException("Descrição é obrigatória.");
        if (await _ctx.FuncaoColaborador.AnyAsync(e => e.Descricao == desc && e.IdFuncaoColaborador != entity.IdFuncaoColaborador, ct))
            throw new InvalidOperationException("Já existe uma função com esta descrição.");
        entity.Descricao = desc;
        _ctx.FuncaoColaborador.Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint id, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(id, ct);
        if (e == null) return false;
        _ctx.FuncaoColaborador.Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
