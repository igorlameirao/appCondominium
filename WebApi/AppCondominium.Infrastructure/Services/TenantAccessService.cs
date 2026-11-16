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

        var idsEndereco = condominios
            .Where(c => c.IdEndereco != null)
            .Select(c => c.IdEndereco!.Value)
            .Distinct()
            .ToList();
        var detalhesEndereco = await CarregarDetalhesEnderecoAsync(idsEndereco, ct);

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
            EnderecoListagemDetalhe? endereco = null;
            if (condo.IdEndereco != null)
                detalhesEndereco.TryGetValue(condo.IdEndereco.Value, out endereco);
            var enderecoResumo = FormatarEnderecoResumo(condo, endereco);
            resultado.Add(new CondominioVinculo(idCondominio, nome, lista, dominio, enderecoResumo));
        }

        return resultado;
    }

    private async Task<Dictionary<uint, EnderecoListagemDetalhe>> CarregarDetalhesEnderecoAsync(
        IReadOnlyList<uint> idsEndereco,
        CancellationToken ct)
    {
        if (idsEndereco.Count == 0)
            return new Dictionary<uint, EnderecoListagemDetalhe>();

        var rows = await (
            from en in _db.Endereco.AsNoTracking()
            where en.IdEndereco != null && idsEndereco.Contains(en.IdEndereco.Value)
            join b in _db.Bairro.AsNoTracking() on en.IdBairro equals b.IdBairro into bairroG
            from b in bairroG.DefaultIfEmpty()
            join m in _db.Municipio.AsNoTracking() on b.CodigoIBGEMunicipio equals m.CodigoIBGEMunicipio into munG
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

    private static string? FormatarEnderecoResumo(Condominio condo, EnderecoListagemDetalhe? detalhe)
    {
        var logradouro = detalhe?.Logradouro?.Trim();
        var numero = condo.NumeroEndereco?.ToString();
        var complemento = condo.ComplementoEndereco?.Trim();

        string? linha = null;
        if (!string.IsNullOrWhiteSpace(logradouro))
            linha = !string.IsNullOrWhiteSpace(numero) ? $"{logradouro}, {numero}" : logradouro;
        else if (condo.IdEndereco != null)
            linha = !string.IsNullOrWhiteSpace(numero) ? $"Logradouro não informado, {numero}" : null;

        if (!string.IsNullOrWhiteSpace(complemento))
            linha = string.IsNullOrWhiteSpace(linha) ? complemento : $"{linha} - {complemento}";

        var municipio = detalhe?.NomeMunicipio?.Trim();
        var uf = detalhe?.SiglaUf?.Trim();
        string? local = null;
        if (!string.IsNullOrWhiteSpace(municipio) && !string.IsNullOrWhiteSpace(uf))
            local = $"{municipio}/{uf}";
        else if (!string.IsNullOrWhiteSpace(municipio))
            local = municipio;
        else if (!string.IsNullOrWhiteSpace(uf))
            local = uf;

        if (!string.IsNullOrWhiteSpace(linha) && !string.IsNullOrWhiteSpace(local))
            return $"{linha} – {local}";
        if (!string.IsNullOrWhiteSpace(linha))
            return linha;
        if (!string.IsNullOrWhiteSpace(local))
            return local;

        return condo.IdEndereco != null ? "Endereço não cadastrado" : null;
    }

    private sealed class EnderecoListagemDetalhe
    {
        public uint IdEndereco { get; set; }
        public string? Logradouro { get; set; }
        public string? NomeBairro { get; set; }
        public string? NomeMunicipio { get; set; }
        public string? SiglaUf { get; set; }
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