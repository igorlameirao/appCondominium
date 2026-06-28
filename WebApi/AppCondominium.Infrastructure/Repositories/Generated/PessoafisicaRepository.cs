using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class PessoafisicaRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public PessoafisicaRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<Pessoafisica> BaseQuery() => _ctx.Set<Pessoafisica>();

    private IQueryable<Pessoafisica> ApplyCondominioFilter(IQueryable<Pessoafisica> query)
    {
        return query;
    }

    public async Task<PagedResult<Pessoafisica>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        if (!string.IsNullOrWhiteSpace(filter) && filter.Length >= 3)
            query = query.Where(e => (e.Email != null && e.Email.Contains(filter)));

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<Pessoafisica> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<Pessoafisica?> GetByIdAsync(uint? idPessoa, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdPessoa == idPessoa, ct);
    }

    public async Task<Pessoafisica> AddAsync(Pessoafisica entity, CancellationToken ct = default)
    {

        await _ctx.Set<Pessoafisica>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(Pessoafisica entity, CancellationToken ct = default)
    {
        _ctx.Set<Pessoafisica>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idPessoa, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idPessoa, ct);
        if (e == null) return false;
        _ctx.Set<Pessoafisica>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
