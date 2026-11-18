using AppCondominium.Application.Common;
using AppCondominium.Application.ConfiguracaoCondominio;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class ConfiguracaoCondominioRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;
    private readonly ILogger<ConfiguracaoCondominioRepository> _logger;

    public ConfiguracaoCondominioRepository(
        AppDbContext ctx,
        ICondominioContext condominio,
        ILogger<ConfiguracaoCondominioRepository> logger)
    {
        _ctx = ctx;
        _condominio = condominio;
        _logger = logger;
    }

    private IQueryable<ConfiguracaoCondominio> BaseQuery() => _ctx.Set<ConfiguracaoCondominio>();

    private IQueryable<ConfiguracaoCondominio> ApplyCondominioFilter(IQueryable<ConfiguracaoCondominio> query)
    {
        var tenantId = _condominio.RequireTenantId();
        query = query.Where(e => e.IdCondominio == tenantId);
        return query;
    }

    public async Task<PagedResult<ConfiguracaoCondominio>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        if (!string.IsNullOrWhiteSpace(filter) && filter.Trim().Length >= 3)
        {
            var termo = filter.Trim();
            query = query.Where(c =>
                _ctx.Condominio.AsNoTracking().Any(cond =>
                    cond.IdCondominio == c.IdCondominio
                    && cond.Nome != null
                    && cond.Nome.Contains(termo)));
        }

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<ConfiguracaoCondominio> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<ConfiguracaoCondominio?> GetByIdAsync(uint? idConfiguracao, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdConfiguracao == idConfiguracao, ct);
    }

    public async Task<ConfiguracaoCondominio> AddAsync(ConfiguracaoCondominio entity, CancellationToken ct = default)
    {
        var tenantId = _condominio.RequireTenantId();
        entity.IdCondominio = tenantId;
        ConfiguracaoCondominioRetencaoRules.Validar(entity);

        await _ctx.Set<ConfiguracaoCondominio>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        RegistrarRetencaoAlterada(tenantId, anteriorHistorico: null, anteriorFotos: null, entity);
        return entity;
    }

    public async Task UpdateAsync(ConfiguracaoCondominio entity, CancellationToken ct = default)
    {
        var tenantId = _condominio.RequireTenantId();
        entity.IdCondominio = tenantId;
        ConfiguracaoCondominioRetencaoRules.Validar(entity);

        var anterior = await ApplyCondominioFilter(BaseQuery().AsNoTracking())
            .FirstOrDefaultAsync(e => e.IdConfiguracao == entity.IdConfiguracao, ct);

        _ctx.Set<ConfiguracaoCondominio>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
        RegistrarRetencaoAlterada(
            tenantId,
            anterior?.RetencaoHistoricoEncomendasMeses,
            anterior?.RetencaoFotosEncomendasMeses,
            entity);
    }

    private void RegistrarRetencaoAlterada(
        uint tenantId,
        int? anteriorHistorico,
        int? anteriorFotos,
        ConfiguracaoCondominio atual)
    {
        if (anteriorHistorico == atual.RetencaoHistoricoEncomendasMeses
            && anteriorFotos == atual.RetencaoFotosEncomendasMeses)
            return;

        _logger.LogInformation(
            "Configuração de retenção alterada IdCondominio={IdCondominio}: historico {HistoricoAnterior} -> {HistoricoNovo}, fotos {FotosAnterior} -> {FotosNovo}",
            tenantId,
            anteriorHistorico,
            atual.RetencaoHistoricoEncomendasMeses,
            anteriorFotos,
            atual.RetencaoFotosEncomendasMeses);
    }

    public async Task<bool> DeleteAsync(uint? idConfiguracao, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idConfiguracao, ct);
        if (e == null) return false;
        _ctx.Set<ConfiguracaoCondominio>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}
