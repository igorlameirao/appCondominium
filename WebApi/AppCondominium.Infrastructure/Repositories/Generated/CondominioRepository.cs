using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Domain.Vinculos;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class CondominioRepository
{
    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public CondominioRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<Condominio> BaseQuery() => _ctx.Set<Condominio>();

    private IQueryable<Condominio> ApplyCondominioFilter(IQueryable<Condominio> query)
    {
        var tenantId = _condominio.RequireTenantId();
        query = query.Where(e => e.IdCondominio == tenantId);
        return query;
    }

    public async Task<PagedResult<Condominio>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        if (!string.IsNullOrWhiteSpace(filter) && filter.Length >= 3)
            query = query.Where(e => (e.Nome != null && e.Nome.Contains(filter)) || (e.Dominio != null && e.Dominio.Contains(filter)));

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<Condominio> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<Condominio?> GetByIdAsync(uint? idCondominio, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdCondominio == idCondominio, ct);
    }

    public Task<Condominio> AddAsync(Condominio entity, CancellationToken ct = default)
        => AddAsync(entity, null, ct);

    public async Task<Condominio> AddAsync(Condominio entity, uint? idPessoaCriador, CancellationToken ct = default)
    {
        var tenantAtual = _condominio.RequireTenantId();
        entity.IdCondominio = null;
        entity.Nome = entity.Nome?.Trim();
        entity.Dominio = entity.Dominio?.Trim();
        entity.CNPJ = NormalizarCnpj(entity.CNPJ);
        entity.ComplementoEndereco = string.IsNullOrWhiteSpace(entity.ComplementoEndereco)
            ? null
            : entity.ComplementoEndereco.Trim();

        uint? idPerfil = null;
        if (idPessoaCriador is uint idPessoa)
        {
            var hoje = PessoaVinculoAtivo.HojeUtc();
            idPerfil = await _ctx.Set<PessoaVinculo>().IgnoreQueryFilters().AsNoTracking()
                .Where(v => v.IdPessoa == idPessoa && v.IdCondominio == tenantAtual
                    && v.DataInicio <= hoje && (v.DataFim == null || v.DataFim >= hoje))
                .Select(v => v.IdPerfil)
                .FirstOrDefaultAsync(ct);
            if (idPerfil == null)
            {
                var administrador = await _ctx.Set<PerfilAcesso>().AsNoTracking()
                    .FirstOrDefaultAsync(p => p.Descricao != null && p.Descricao.ToLower() == "administrador", ct);
                idPerfil = administrador?.IdPerfil;
            }
        }

        await _ctx.Set<Condominio>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);

        if (idPessoaCriador is uint criador && idPerfil is uint perfil && entity.IdCondominio is uint idNovo)
            await VincularCriadorAsync(criador, idNovo, perfil, ct);

        return entity;
    }

    private async Task VincularCriadorAsync(uint idPessoa, uint idCondominio, uint idPerfil, CancellationToken ct)
    {
        var tenantAnterior = _condominio.IdCondominio;
        _condominio.SetCondominio(idCondominio);
        try
        {
            var hoje = PessoaVinculoAtivo.HojeUtc();
            var existe = await _ctx.Set<PessoaVinculo>().IgnoreQueryFilters()
                .AnyAsync(v => v.IdPessoa == idPessoa && v.IdCondominio == idCondominio
                    && v.DataInicio <= hoje && (v.DataFim == null || v.DataFim >= hoje), ct);
            if (existe)
                return;

            await _ctx.Set<PessoaVinculo>().AddAsync(new PessoaVinculo
            {
                IdPessoa = idPessoa,
                IdCondominio = idCondominio,
                CodigoPapelVinculo = PapelVinculoCodigos.Funcionario,
                IdPerfil = idPerfil,
                DataInicio = hoje,
                Responsavel = 0
            }, ct);
            await _ctx.SaveChangesAsync(ct);
        }
        finally
        {
            if (tenantAnterior is uint anterior)
                _condominio.SetCondominio(anterior);
        }
    }

    private static string? NormalizarCnpj(string? cnpj)
    {
        if (string.IsNullOrWhiteSpace(cnpj))
            return null;
        var limpo = new string(cnpj.Where(char.IsLetterOrDigit).ToArray()).ToUpperInvariant();
        return limpo.Length == 0 ? null : limpo;
    }

    public async Task UpdateAsync(Condominio entity, CancellationToken ct = default)
    {
        var tenantId = _condominio.RequireTenantId();
        entity.IdCondominio = tenantId;
        _ctx.Set<Condominio>().Update(entity);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idCondominio, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idCondominio, ct);
        if (e == null) return false;
        _ctx.Set<Condominio>().Remove(e);
        await _ctx.SaveChangesAsync(ct);
        return true;
    }
}