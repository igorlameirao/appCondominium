using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class EnderecoRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public EnderecoRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<Endereco> BaseQuery() => _ctx.Set<Endereco>();

    private IQueryable<Endereco> ApplyCondominioFilter(IQueryable<Endereco> query)
    {
        return query;
    }

    public async Task<PagedResult<Endereco>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        if (!string.IsNullOrWhiteSpace(filter) && filter.Length >= 3)
            query = query.Where(e => (e.CEP != null && e.CEP.Contains(filter)) || (e.Logradouro != null && e.Logradouro.Contains(filter)));

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<Endereco> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<Endereco?> GetByIdAsync(uint? idEndereco, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdEndereco == idEndereco, ct);
    }

    public async Task<Endereco> AddAsync(Endereco entity, CancellationToken ct = default)
    {

        await _ctx.Set<Endereco>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(Endereco entity, CancellationToken ct = default)
    {
        _ctx.Set<Endereco>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idEndereco, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idEndereco, ct);
        if (e == null) return false;
        _ctx.Set<Endereco>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
