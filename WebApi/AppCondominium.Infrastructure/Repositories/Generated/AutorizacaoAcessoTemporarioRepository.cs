using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class AutorizacaoAcessoTemporarioRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public AutorizacaoAcessoTemporarioRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<AutorizacaoAcessoTemporario> BaseQuery() => _ctx.Set<AutorizacaoAcessoTemporario>();

    private IQueryable<AutorizacaoAcessoTemporario> ApplyCondominioFilter(IQueryable<AutorizacaoAcessoTemporario> query)
    {
        var tenantId = _condominio.RequireTenantId();
        query = query.Where(e => e.IdCondominio == tenantId);
        return query;
    }

    public async Task<PagedResult<AutorizacaoAcessoTemporario>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        if (!string.IsNullOrWhiteSpace(filter) && filter.Length >= 3)
            query = query.Where(e => (e.NomeVisitante != null && e.NomeVisitante.Contains(filter)) || (e.DocumentoVisitante != null && e.DocumentoVisitante.Contains(filter)));

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<AutorizacaoAcessoTemporario> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<AutorizacaoAcessoTemporario?> GetByIdAsync(uint? idAutorizacao, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdAutorizacao == idAutorizacao, ct);
    }

    public async Task<AutorizacaoAcessoTemporario> AddAsync(AutorizacaoAcessoTemporario entity, CancellationToken ct = default)
    {
        var tenantId = _condominio.RequireTenantId();
        entity.IdCondominio = tenantId;

        await _ctx.Set<AutorizacaoAcessoTemporario>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(AutorizacaoAcessoTemporario entity, CancellationToken ct = default)
    {
        var tenantId = _condominio.RequireTenantId();
        entity.IdCondominio = tenantId;
        _ctx.Set<AutorizacaoAcessoTemporario>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idAutorizacao, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idAutorizacao, ct);
        if (e == null) return false;
        _ctx.Set<AutorizacaoAcessoTemporario>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
