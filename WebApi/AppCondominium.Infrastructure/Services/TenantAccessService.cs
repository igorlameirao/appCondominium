using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.Infrastructure.Services;

public class TenantAccessService : ITenantAccessService
{
    private readonly AppDbContext _db;

    public TenantAccessService(AppDbContext db) => _db = db;

    public async Task<bool> UsuarioTemAcessoAsync(uint idPessoa, uint idCondominio, CancellationToken ct = default)
    {
        var viaCondominio = await _db.PessoaCondominio.IgnoreQueryFilters()
            .AnyAsync(v => v.IdPessoa == idPessoa && v.IdCondominio == idCondominio, ct);
        if (viaCondominio)
            return true;

        return await (
            from pu in _db.PessoaUnidade.IgnoreQueryFilters()
            join u in _db.Unidade.IgnoreQueryFilters() on pu.IdUnidade equals u.IdUnidade
            where pu.IdPessoa == idPessoa && u.IdCondominio == idCondominio
            select pu).AnyAsync(ct);
    }

    public async Task<IReadOnlyList<Condominio>> ListarCondominiosAutorizadosAsync(
        uint idPessoa, string? filtroNome, CancellationToken ct = default)
    {
        var porVinculo = await _db.PessoaCondominio.IgnoreQueryFilters()
            .Where(v => v.IdPessoa == idPessoa && v.IdCondominio != null)
            .Select(v => v.IdCondominio!.Value)
            .ToListAsync(ct);

        var porUnidade = await (
            from pu in _db.PessoaUnidade.IgnoreQueryFilters()
            join u in _db.Unidade.IgnoreQueryFilters() on pu.IdUnidade equals u.IdUnidade
            where pu.IdPessoa == idPessoa && u.IdCondominio != null
            select u.IdCondominio!.Value).ToListAsync(ct);

        var ids = porVinculo.Concat(porUnidade).Distinct().ToList();
        var query = _db.Condominio.IgnoreQueryFilters().AsNoTracking()
            .Where(c => c.IdCondominio != null && ids.Contains(c.IdCondominio.Value));

        if (!string.IsNullOrWhiteSpace(filtroNome) && filtroNome.Length >= 3)
            query = query.Where(c => c.Nome != null && c.Nome.Contains(filtroNome));

        return await query.OrderBy(c => c.Nome).Take(15).ToListAsync(ct);
    }

    public async Task<IReadOnlyList<CondominioVinculo>> ListarVinculosAsync(uint idPessoa, CancellationToken ct = default)
    {
        var porCondominio = await _db.PessoaCondominio.IgnoreQueryFilters().AsNoTracking()
            .Where(v => v.IdPessoa == idPessoa && v.IdCondominio != null)
            .ToListAsync(ct);

        var porUnidade = await (
            from pu in _db.PessoaUnidade.IgnoreQueryFilters()
            join u in _db.Unidade.IgnoreQueryFilters() on pu.IdUnidade equals u.IdUnidade
            where pu.IdPessoa == idPessoa && u.IdCondominio != null
            select u.IdCondominio!.Value).Distinct().ToListAsync(ct);

        var ids = porCondominio.Select(v => v.IdCondominio!.Value).Concat(porUnidade).Distinct().ToList();
        if (ids.Count == 0)
            return Array.Empty<CondominioVinculo>();

        var condominios = await _db.Condominio.IgnoreQueryFilters().AsNoTracking()
            .Where(c => c.IdCondominio != null && ids.Contains(c.IdCondominio.Value))
            .OrderBy(c => c.Nome)
            .ToListAsync(ct);

        var perfis = await _db.PerfilAcesso.AsNoTracking().ToListAsync(ct);
        var porId = perfis.ToDictionary(p => p.IdPerfil);
        var morador = perfis.FirstOrDefault(p =>
            string.Equals(p.Descricao?.Trim(), "Morador", StringComparison.OrdinalIgnoreCase));
        var idsUnidade = porUnidade.ToHashSet();

        var resultado = new List<CondominioVinculo>(condominios.Count);
        foreach (var condo in condominios)
        {
            if (condo.IdCondominio is not uint idCondominio)
                continue;

            var vinculo = porCondominio.FirstOrDefault(v => v.IdCondominio == idCondominio);
            var lista = new List<PerfilVinculo>();
            if (vinculo?.IdPerfil is uint idPerfil && porId.TryGetValue(idPerfil, out var perfil))
                lista.Add(new PerfilVinculo(perfil.IdPerfil, NomePerfil(perfil)));

            var semPerfilExplicito = vinculo == null || vinculo.IdPerfil == null;
            var temUnidade = idsUnidade.Contains(idCondominio);
            if (morador != null
                && (semPerfilExplicito || temUnidade)
                && lista.All(p => p.IdPerfil != morador.IdPerfil))
            {
                lista.Add(new PerfilVinculo(morador.IdPerfil, NomePerfil(morador)));
            }

            var nome = string.IsNullOrWhiteSpace(condo.Nome) ? $"Condomínio {idCondominio}" : condo.Nome.Trim();
            var dominio = string.IsNullOrWhiteSpace(condo.Dominio) ? null : condo.Dominio.Trim();
            resultado.Add(new CondominioVinculo(idCondominio, nome, lista, dominio));
        }

        return resultado;
    }

    public async Task<bool> UsuarioTemPerfilAsync(uint idPessoa, uint idCondominio, uint idPerfil, CancellationToken ct = default)
    {
        var vinculos = await ListarVinculosAsync(idPessoa, ct);
        return vinculos.Any(v => v.IdCondominio == idCondominio && v.Perfis.Any(p => p.IdPerfil == idPerfil));
    }

    public async Task<uint?> ResolverIdPessoaPorEmailAsync(string email, CancellationToken ct = default)
    {
        var normalizado = email.Trim().ToLowerInvariant();
        var pf = await _db.Pessoafisica.IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.Email != null && p.Email.ToLower() == normalizado, ct);
        return pf?.IdPessoa;
    }

    private static string NomePerfil(PerfilAcesso perfil) =>
        string.IsNullOrWhiteSpace(perfil.Descricao) ? "Perfil" : perfil.Descricao.Trim();
}
