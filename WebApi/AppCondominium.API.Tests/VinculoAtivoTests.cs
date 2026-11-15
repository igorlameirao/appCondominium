using AppCondominium.Domain;
using AppCondominium.Domain.Entities;
using AppCondominium.Domain.Vinculos;
using AppCondominium.Infrastructure.Persistence;
using AppCondominium.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace AppCondominium.API.Tests;

public class VinculoAtivoTests
{
    private static readonly DateOnly Hoje = DateOnly.FromDateTime(DateTime.UtcNow);
    private static readonly DateOnly Ontem = Hoje.AddDays(-1);
    private static readonly DateOnly Amanha = Hoje.AddDays(1);

    [Fact]
    public void Vigencia_respeita_data_inicio_e_fim()
    {
        Assert.True(VinculoVigencia.EstaAtivo(null, null, Hoje));
        Assert.True(VinculoVigencia.EstaAtivo(Ontem, null, Hoje));
        Assert.True(VinculoVigencia.EstaAtivo(null, Amanha, Hoje));
        Assert.True(VinculoVigencia.EstaAtivo(Ontem, Amanha, Hoje));
        Assert.False(VinculoVigencia.EstaAtivo(Amanha, null, Hoje));
        Assert.False(VinculoVigencia.EstaAtivo(null, Ontem, Hoje));
    }

    [Fact]
    public async Task Usuario_com_vinculo_ativo_tem_acesso()
    {
        await using var db = await SeedVinculosAsync();
        var access = new TenantAccessService(db);
        Assert.True(await access.UsuarioTemAcessoAsync(1, 1));
    }

    [Fact]
    public async Task Vinculo_direto_encerrado_por_data_fim_nega_acesso()
    {
        await using var db = await SeedVinculosAsync();
        var access = new TenantAccessService(db);
        Assert.False(await access.UsuarioTemAcessoAsync(2, 1));
    }

    [Fact]
    public async Task Vinculo_por_unidade_encerrado_nega_acesso_sem_outro_vinculo()
    {
        await using var db = await SeedVinculosAsync();
        var access = new TenantAccessService(db);
        Assert.False(await access.UsuarioTemAcessoAsync(3, 1));
    }

    [Fact]
    public async Task Vinculo_direto_revogado_mas_unidade_ativa_mantem_acesso()
    {
        await using var db = await SeedVinculosAsync();
        var access = new TenantAccessService(db);
        Assert.True(await access.UsuarioTemAcessoAsync(4, 1));
    }

    [Fact]
    public async Task Sem_vinculo_ativo_em_nenhum_condominio()
    {
        await using var db = await SeedVinculosAsync();
        var access = new TenantAccessService(db);
        Assert.False(await access.UsuarioTemAcessoAsync(5, 1));
        Assert.Empty(await access.ListarVinculosAsync(5));
    }

    [Fact]
    public async Task Acesso_condominio_a_nao_autoriza_condominio_b()
    {
        await using var db = await SeedVinculosAsync();
        var access = new TenantAccessService(db);
        Assert.True(await access.UsuarioTemAcessoAsync(1, 1));
        Assert.False(await access.UsuarioTemAcessoAsync(1, 2));
    }

    [Fact]
    public async Task Listar_condominios_so_retorna_vinculos_ativos()
    {
        await using var db = await SeedVinculosAsync();
        var access = new TenantAccessService(db);
        var lista = await access.ListarCondominiosAutorizadosAsync(4, null);
        Assert.Single(lista);
        Assert.Equal(1u, lista[0].IdCondominio);
    }

    private static async Task<AppDbContext> SeedVinculosAsync()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(options, new TenantFixoVinculo());

        db.Condominio.Add(new Condominio { IdCondominio = 1, Nome = "Alpha" });
        db.Condominio.Add(new Condominio { IdCondominio = 2, Nome = "Beta" });
        db.Unidade.Add(new Unidade { IdUnidade = 10, IdCondominio = 1 });
        db.Unidade.Add(new Unidade { IdUnidade = 20, IdCondominio = 2 });
        db.PerfilAcesso.Add(new PerfilAcesso { IdPerfil = 2, Descricao = "Morador" });

        static PessoaVinculo V(
            uint pessoa,
            uint? condo,
            uint? unidade,
            DateOnly ini,
            DateOnly? fim,
            uint? perfil = 2) => new()
        {
            IdPessoa = pessoa,
            IdCondominio = condo,
            IdUnidade = unidade,
            CodigoPapelVinculo = unidade is null ? PapelVinculoCodigos.Funcionario : PapelVinculoCodigos.Morador,
            IdPerfil = unidade is null ? perfil : null,
            DataInicio = ini,
            DataFim = fim,
            Responsavel = 0,
        };

        db.PessoaVinculo.Add(V(1, 1, null, Ontem, null));
        db.PessoaVinculo.Add(V(2, 1, null, Ontem, Ontem));
        db.PessoaVinculo.Add(V(3, 1, 10, Ontem, Ontem, perfil: null));
        db.PessoaVinculo.Add(V(4, 1, null, Ontem, Ontem));
        db.PessoaVinculo.Add(V(4, 1, 10, Ontem, null, perfil: null));
        db.PessoaVinculo.Add(V(5, 1, null, Ontem, Ontem));
        db.PessoaVinculo.Add(V(5, 1, 10, Ontem, Ontem, perfil: null));

        await db.SaveChangesAsync();
        return db;
    }

    private sealed class TenantFixoVinculo : Application.Interfaces.ICondominioContext
    {
        public uint? IdCondominio => null;
        public void SetCondominio(uint idCondominio) { }
        public void Clear() { }
        public uint RequireTenantId() => throw new InvalidOperationException();
    }
}