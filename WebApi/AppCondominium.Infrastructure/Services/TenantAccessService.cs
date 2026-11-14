using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Domain.Vinculos;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.Infrastructure.Services;

public class TenantAccessService : ITenantAccessService
{
    private readonly AppDbContext _db;

    public TenantAccessService(AppDbContext db) => _db = db;

    public async Task<bool> UsuarioTemAcessoAsync(uint idPessoa, uint idCondominio, CancellationToken ct = default)
    {
        var hoje = PessoaVinculoAtivo.HojeUtc();
        return await _db.PessoaVinculo.IgnoreQueryFilters().AsNoTracking()
            .AnyAsync(v => v.IdPessoa == idPessoa
                && v.IdCondominio == idCondominio
                && v.DataInicio <= hoje
                && (v.DataFim == null || v.DataFim >= hoje), ct);
    }

    public async Task<IReadOnlyList<Condominio>> ListarCondominiosAutorizadosAsync(
        uint idPessoa, string? filtroNome, CancellationToken ct = default)
    {
        var hoje = PessoaVinculoAtivo.HojeUtc();
        var ids = await _db.PessoaVinculo.IgnoreQueryFilters().AsNoTracking()
            .Where(v => v.IdPessoa == idPessoa
                && v.IdCondominio != null
                && v.DataInicio <= hoje
                && (v.DataFim == null || v.DataFim >= hoje))
            .Select(v => v.IdCondominio!.Value)
            .Distinct()
            .ToListAsync(ct);

        if (ids.Count == 0)
            return Array.Empty<Condominio>();

        var query = _db.Condominio.IgnoreQueryFilters().AsNoTracking()
            .Where(c => c.IdCondominio != null && ids.Contains(c.IdCondominio.Value));

        if (!string.IsNullOrWhiteSpace(filtroNome) && filtroNome.Length >= 3)
            query = query.Where(c => c.Nome != null && c.Nome.Contains(filtroNome));

        return await query.OrderBy(c => c.Nome).Take(15).ToListAsync(ct);
    }

    public async Task<IReadOnlyList<CondominioVinculo>> ListarVinculosAsync(uint idPessoa, CancellationToken ct = default)
    {
        var hoje = PessoaVinculoAtivo.HojeUtc();
        var vinculos = await _db.PessoaVinculo.IgnoreQueryFilters().AsNoTracking()
            .Where(v => v.IdPessoa == idPessoa
                && v.IdCondominio != null
                && v.DataInicio <= hoje
                && (v.DataFim == null || v.DataFim >= hoje))
            .ToListAsync(ct);

        var ids = vinculos.Select(v => v.IdCondominio!.Value).Distinct().ToList();
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
        var proprietario = perfis.FirstOrDefault(p =>
            string.Equals(p.Descricao?.Trim(), "Proprietário", StringComparison.OrdinalIgnoreCase));

        var resultado = new List<CondominioVinculo>(condominios.Count);
        foreach (var condo in condominios)
        {
            if (condo.IdCondominio is not uint idCondominio)
                continue;

            var lista = new List<PerfilVinculo>();
            var noCondo = vinculos.Where(v => v.IdCondominio == idCondominio).ToList();

            foreach (var idPerfil in noCondo.Where(v => v.IdPerfil != null).Select(v => v.IdPerfil!.Value).Distinct())
            {
                if (porId.TryGetValue(idPerfil, out var perfil))
                    lista.Add(new PerfilVinculo(perfil.IdPerfil, NomePerfil(perfil)));
            }

            if (lista.Count == 0)
            {
                var temProprietarioPadrao = noCondo.Any(v =>
                    v.CodigoPapelVinculo is uint cod && PapelVinculoCodigos.PapeisProprietarioPadrao.Contains(cod));
                var perfilPadrao = temProprietarioPadrao ? proprietario : morador;
                if (perfilPadrao?.IdPerfil is uint idPerfilPadrao)
                    lista.Add(new PerfilVinculo(idPerfilPadrao, NomePerfil(perfilPadrao)));
            }
            else if (morador != null && noCondo.Any(v => v.IdUnidade != null)
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