using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class FornecedorRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public FornecedorRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<Fornecedor> BaseQuery() => _ctx.Set<Fornecedor>();

    private IQueryable<Fornecedor> ApplyCondominioFilter(IQueryable<Fornecedor> query)
    {
        if (_condominio.IdCondominio.HasValue)
            query = query.Where(e => e.IdCondominio == _condominio.IdCondominio.Value);
        return query;
    }

    public async Task<PagedResult<Fornecedor>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<Fornecedor> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<Fornecedor?> GetByIdAsync(uint? idPessoa, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdPessoa == idPessoa, ct);
    }

    public async Task<Fornecedor> AddAsync(Fornecedor entity, CancellationToken ct = default)
    {

        if (_condominio.IdCondominio.HasValue)
            entity.IdCondominio = _condominio.IdCondominio.Value;

        await _ctx.Set<Fornecedor>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(Fornecedor entity, CancellationToken ct = default)
    {
        _ctx.Set<Fornecedor>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idPessoa, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idPessoa, ct);
        if (e == null) return false;
        _ctx.Set<Fornecedor>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
