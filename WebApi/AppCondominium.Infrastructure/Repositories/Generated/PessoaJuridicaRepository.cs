using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class PessoaJuridicaRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public PessoaJuridicaRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<PessoaJuridica> BaseQuery() => _ctx.Set<PessoaJuridica>();

    private IQueryable<PessoaJuridica> ApplyCondominioFilter(IQueryable<PessoaJuridica> query)
    {
        return query;
    }

    public async Task<PagedResult<PessoaJuridica>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        if (!string.IsNullOrWhiteSpace(filter) && filter.Length >= 3)
            query = query.Where(e => (e.NomeFantasia != null && e.NomeFantasia.Contains(filter)) || (e.InscricaoEstadual != null && e.InscricaoEstadual.Contains(filter)) || (e.InscricaoMunicipal != null && e.InscricaoMunicipal.Contains(filter)));

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<PessoaJuridica> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<PessoaJuridica?> GetByIdAsync(uint? idPessoa, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdPessoa == idPessoa, ct);
    }

    public async Task<PessoaJuridica> AddAsync(PessoaJuridica entity, CancellationToken ct = default)
    {

        await _ctx.Set<PessoaJuridica>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(PessoaJuridica entity, CancellationToken ct = default)
    {
        _ctx.Set<PessoaJuridica>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idPessoa, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idPessoa, ct);
        if (e == null) return false;
        _ctx.Set<PessoaJuridica>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
