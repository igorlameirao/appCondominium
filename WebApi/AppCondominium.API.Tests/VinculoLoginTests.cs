using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;
using AppCondominium.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace AppCondominium.API.Tests;

public class VinculoLoginTests
{
    [Fact]
    public async Task Lista_condominios_e_perfis_distintos_por_vinculo_e_unidade()
    {
        await using var db = await SeedAsync();
        var access = new TenantAccessService(db);

        var soAdmin = await access.ListarVinculosAsync(10);
        var unico = Assert.Single(soAdmin);
        Assert.Equal(1u, unico.IdCondominio);
        Assert.Equal("Alpha", unico.Nome);
        Assert.Equal("alpha", unico.Dominio);
        Assert.Equal(new[] { "Administrador" }, unico.Perfis.Select(p => p.Nome).ToArray());

        var adminEMorador = await access.ListarVinculosAsync(11);
        var condo = Assert.Single(adminEMorador);
        Assert.Equal(new[] { "Administrador", "Morador" }, condo.Perfis.Select(p => p.Nome).ToArray());
        Assert.True(await access.UsuarioTemPerfilAsync(11, 1, 1));
        Assert.True(await access.UsuarioTemPerfilAsync(11, 1, 2));
        Assert.False(await access.UsuarioTemPerfilAsync(11, 1, 3));

        var moradorUnico = await access.ListarVinculosAsync(12);
        Assert.Equal(new[] { "Morador" }, Assert.Single(moradorUnico).Perfis.Select(p => p.Nome).ToArray());

        var doisCondos = await access.ListarVinculosAsync(13);
        Assert.Equal(new[] { "Alpha", "Beta" }, doisCondos.Select(v => v.Nome).ToArray());
        Assert.All(doisCondos, v => Assert.Equal("Morador", Assert.Single(v.Perfis).Nome));
    }

    [Fact]
    public async Task Perfil_escolhido_nao_herda_acesso_total_nem_excecao_de_outro_papel()
    {
        await using var db = await SeedAsync();
        var resolver = new PermissionResolver(db);

        var primario = await resolver.SnapshotAsync(11, 1);
        Assert.True(primario.AcessoTotal);
        Assert.Equal("Administrador", primario.Perfil);

        var comoMorador = await resolver.SnapshotPorPerfilAsync(11, 1, 2);
        Assert.False(comoMorador.AcessoTotal);
        Assert.Equal("Morador", comoMorador.Perfil);
        Assert.Contains("BLOCO:Visualizar", comoMorador.Permissoes);
        Assert.DoesNotContain("BLOCO:Alterar", comoMorador.Permissoes);

        var comoAdmin = await resolver.SnapshotPorPerfilAsync(11, 1, 1);
        Assert.True(comoAdmin.AcessoTotal);
    }

    private static async Task<AppDbContext> SeedAsync()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(options, new TenantFixo());
        db.PerfilAcesso.Add(new PerfilAcesso { IdPerfil = 1, Descricao = "Administrador" });
        db.PerfilAcesso.Add(new PerfilAcesso { IdPerfil = 2, Descricao = "Morador" });
        db.PerfilAcesso.Add(new PerfilAcesso { IdPerfil = 3, Descricao = "Síndico" });
        db.Condominio.Add(new Condominio { IdCondominio = 1, Nome = "Alpha", Dominio = "alpha" });
        db.Condominio.Add(new Condominio { IdCondominio = 2, Nome = "Beta", Dominio = "beta" });
        db.Unidade.Add(new Unidade { IdUnidade = 100, IdCondominio = 1 });
        db.Unidade.Add(new Unidade { IdUnidade = 200, IdCondominio = 2 });
        db.PermissionKey.Add(new PermissionKey { IdPermissionKey = 1, Chave = "BLOCO", Nome = "Bloco", Modulo = "Condominio" });
        db.PerfilPermissao.Add(new PerfilPermissao
        {
            IdPerfil = 2,
            IdPermissionKey = 1,
            Visualizar = true
        });
        db.PessoaCondominio.Add(new PessoaCondominio { IdPessoa = 10, IdCondominio = 1, IdPerfil = 1, DataInicio = new DateOnly(2024, 1, 1), TipoVinculo = 1 });
        db.PessoaCondominio.Add(new PessoaCondominio { IdPessoa = 11, IdCondominio = 1, IdPerfil = 1, DataInicio = new DateOnly(2024, 1, 1), TipoVinculo = 1 });
        db.PessoaUnidade.Add(new PessoaUnidade { IdPessoa = 11, IdUnidade = 100, TipoVinculo = 1, DataInicio = new DateOnly(2024, 1, 1) });
        db.PessoaCondominio.Add(new PessoaCondominio { IdPessoa = 12, IdCondominio = 1, IdPerfil = 2, DataInicio = new DateOnly(2024, 1, 1), TipoVinculo = 1 });
        db.PessoaUnidade.Add(new PessoaUnidade { IdPessoa = 12, IdUnidade = 100, TipoVinculo = 1, DataInicio = new DateOnly(2024, 1, 1) });
        db.PessoaUnidade.Add(new PessoaUnidade { IdPessoa = 13, IdUnidade = 100, TipoVinculo = 1, DataInicio = new DateOnly(2024, 1, 1) });
        db.PessoaUnidade.Add(new PessoaUnidade { IdPessoa = 13, IdUnidade = 200, TipoVinculo = 1, DataInicio = new DateOnly(2024, 1, 1) });
        db.PessoaPermissaoExcecao.Add(new PessoaPermissaoExcecao
        {
            IdPessoa = 11,
            IdCondominio = 1,
            IdPermissionKey = 1,
            Visualizar = true,
            Alterar = true
        });
        await db.SaveChangesAsync();
        return db;
    }

    private sealed class TenantFixo : ICondominioContext
    {
        public uint? IdCondominio => null;
        public void SetCondominio(uint idCondominio) { }
        public void Clear() { }
        public uint RequireTenantId() => throw new InvalidOperationException();
    }
}
