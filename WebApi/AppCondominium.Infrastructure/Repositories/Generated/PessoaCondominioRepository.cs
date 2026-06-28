using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class PessoaCondominioRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public PessoaCondominioRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<PessoaCondominio> BaseQuery() => _ctx.Set<PessoaCondominio>();

    private IQueryable<PessoaCondominio> ApplyCondominioFilter(IQueryable<PessoaCondominio> query)
    {
        if (_condominio.IdCondominio.HasValue)
            query = query.Where(e => e.IdCondominio == _condominio.IdCondominio.Value);
        return query;
    }

    public async Task<PagedResult<PessoaCondominio>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<PessoaCondominio> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<PessoaCondominio?> GetByIdAsync(uint? idPessoa, uint? idCondominio, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdPessoa == idPessoa && e.IdCondominio == idCondominio, ct);
    }

    public async Task<PessoaCondominio> AddAsync(PessoaCondominio entity, CancellationToken ct = default)
    {

        if (_condominio.IdCondominio.HasValue)
            entity.IdCondominio = _condominio.IdCondominio.Value;

        await _ctx.Set<PessoaCondominio>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(PessoaCondominio entity, CancellationToken ct = default)
    {
        _ctx.Set<PessoaCondominio>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idPessoa, uint? idCondominio, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idPessoa, idCondominio, ct);
        if (e == null) return false;
        _ctx.Set<PessoaCondominio>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
