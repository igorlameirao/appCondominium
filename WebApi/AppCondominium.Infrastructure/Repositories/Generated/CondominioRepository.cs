using Microsoft.EntityFrameworkCore;
using AppCondominium.Application.Common;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
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

    public async Task<PagedResult<CondominioListItemDto>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        if (!string.IsNullOrWhiteSpace(filter) && filter.Length >= 3)
        {
            query = query.Where(e =>
                (e.Nome != null && e.Nome.Contains(filter))
                || (e.Dominio != null && e.Dominio.Contains(filter))
                || _ctx.Endereco.Any(en =>
                    en.IdEndereco == e.IdEndereco
                    && en.Logradouro != null
                    && en.Logradouro.Contains(filter))
                || _ctx.Endereco.Any(en =>
                    en.IdEndereco == e.IdEndereco
                    && en.IdBairro != null
                    && _ctx.Bairro.Any(b =>
                        b.IdBairro == en.IdBairro
                        && b.Nome != null
                        && b.Nome.Contains(filter)))
                || _ctx.Endereco.Any(en =>
                    en.IdEndereco == e.IdEndereco
                    && en.IdBairro != null
                    && _ctx.Bairro.Any(b =>
                        b.IdBairro == en.IdBairro
                        && b.CodigoIBGEMunicipio != null
                        && _ctx.Municipio.Any(m =>
                            m.CodigoIBGEMunicipio == b.CodigoIBGEMunicipio
                            && m.Nome != null
                            && m.Nome.Contains(filter)))));
        }

        var total = await query.CountAsync(ct);
        var condominios = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var idsEndereco = condominios
            .Where(c => c.IdEndereco != null)
            .Select(c => c.IdEndereco!.Value)
            .Distinct()
            .ToList();

        var detalhesEndereco = await CarregarDetalhesEnderecoAsync(idsEndereco, ct);

        var items = condominios.Select(c => MapearListItem(c, detalhesEndereco)).ToList();
        return new PagedResult<CondominioListItemDto> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    private async Task<Dictionary<uint, EnderecoListagemDetalhe>> CarregarDetalhesEnderecoAsync(
        IReadOnlyList<uint> idsEndereco,
        CancellationToken ct)
    {
        if (idsEndereco.Count == 0)
            return new Dictionary<uint, EnderecoListagemDetalhe>();

        var rows = await (
            from en in _ctx.Endereco.AsNoTracking()
            where en.IdEndereco != null && idsEndereco.Contains(en.IdEndereco.Value)
            join b in _ctx.Bairro.AsNoTracking() on en.IdBairro equals b.IdBairro into bairroG
            from b in bairroG.DefaultIfEmpty()
            join m in _ctx.Municipio.AsNoTracking() on b.CodigoIBGEMunicipio equals m.CodigoIBGEMunicipio into munG
            from m in munG.DefaultIfEmpty()
            select new EnderecoListagemDetalhe
            {
                IdEndereco = en.IdEndereco!.Value,
                Logradouro = en.Logradouro,
                NomeBairro = b != null ? b.Nome : null,
                NomeMunicipio = m != null ? m.Nome : null,
                SiglaUf = m != null ? m.SiglaUF : null,
            }).ToListAsync(ct);

        return rows.ToDictionary(r => r.IdEndereco);
    }

    private static CondominioListItemDto MapearListItem(
        Condominio c,
        IReadOnlyDictionary<uint, EnderecoListagemDetalhe> detalhesEndereco)
    {
        EnderecoListagemDetalhe? detalhe = null;
        if (c.IdEndereco != null)
            detalhesEndereco.TryGetValue(c.IdEndereco.Value, out detalhe);

        return new CondominioListItemDto
        {
            IdCondominio = c.IdCondominio,
            Nome = c.Nome,
            Dominio = c.Dominio,
            IdEndereco = c.IdEndereco,
            NumeroEndereco = c.NumeroEndereco,
            ComplementoEndereco = c.ComplementoEndereco,
            EnderecoLogradouro = detalhe?.Logradouro,
            NomeBairro = detalhe?.NomeBairro,
            NomeMunicipio = detalhe?.NomeMunicipio,
            SiglaUf = detalhe?.SiglaUf,
        };
    }

    private sealed class EnderecoListagemDetalhe
    {
        public uint IdEndereco { get; set; }
        public string? Logradouro { get; set; }
        public string? NomeBairro { get; set; }
        public string? NomeMunicipio { get; set; }
        public string? SiglaUf { get; set; }
    }

    public async Task<Condominio?> GetByIdAsync(uint? idCondominio, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdCondominio == idCondominio, ct);
    }

    public async Task<Condominio> AddAsync(Condominio entity, CancellationToken ct = default)
    {
        var tenantId = _condominio.RequireTenantId();
        entity.IdCondominio = tenantId;

        await _ctx.Set<Condominio>().AddAsync(entity, ct);
        await _ctx.SaveChangesAsync(ct);
        return entity;
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
