using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;
using AppCondominium.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace AppCondominium.API.Tests;

public class AuthContextoTests
{
    [Fact]
    public async Task Minhas_unidades_lista_apenas_vinculos_ativos_no_tenant()
    {
        await using var db = await SeedMinhasUnidadesAsync();
        var hoje = DateOnly.FromDateTime(DateTime.UtcNow);
        var condominio = new TenantFixo(1);

        var items = await QueryMinhasUnidadesAsync(db, condominio, 20, hoje);

        Assert.Equal(2, items.Count);
        Assert.Contains(items, i => i.IdUnidade == 101);
        Assert.Contains(items, i => i.IdUnidade == 102);
        Assert.All(items, i => Assert.False(string.IsNullOrWhiteSpace(i.Descricao)));
    }

    [Fact]
    public async Task Minhas_unidades_nao_expoem_outro_condominio()
    {
        await using var db = await SeedMinhasUnidadesAsync();
        var hoje = DateOnly.FromDateTime(DateTime.UtcNow);
        var condominio = new TenantFixo(2);

        var items = await QueryMinhasUnidadesAsync(db, condominio, 20, hoje);

        Assert.Single(items);
        Assert.Equal(201u, items[0].IdUnidade);
    }

    [Fact]
    public async Task Trocar_condominio_com_perfil_nao_autorizado_falha_na_validacao_de_acesso()
    {
        await using var db = await VinculoLoginTests_SeedReuseAsync();
        var access = new TenantAccessService(db);

        Assert.False(await access.UsuarioTemPerfilAsync(11, 2, 1));
        Assert.True(await access.UsuarioTemPerfilAsync(11, 1, 2));
    }

    [Fact]
    public async Task Trocar_perfil_valida_vinculo_ativo()
    {
        await using var db = await VinculoLoginTests_SeedReuseAsync();
        var access = new TenantAccessService(db);

        Assert.True(await access.UsuarioTemPerfilAsync(11, 1, 1));
        Assert.True(await access.UsuarioTemPerfilAsync(11, 1, 2));
        Assert.False(await access.UsuarioTemPerfilAsync(11, 1, 3));
    }

    private static async Task<List<(uint IdUnidade, string Descricao)>> QueryMinhasUnidadesAsync(
        AppDbContext db,
        ICondominioContext condominio,
        uint idPessoa,
        DateOnly hoje)
    {
        var idCondominio = condominio.RequireTenantId();
        return await (
            from pu in db.PessoaUnidade.IgnoreQueryFilters()
            join u in db.Unidade.IgnoreQueryFilters() on pu.IdUnidade equals u.IdUnidade
            join b in db.Bloco.IgnoreQueryFilters() on u.IdBloco equals b.IdBloco into blocoJoin
            from b in blocoJoin.DefaultIfEmpty()
            where pu.IdPessoa == idPessoa
                  && u.IdCondominio == idCondominio
                  && (pu.DataInicio == null || pu.DataInicio <= hoje)
                  && (pu.DataFim == null || pu.DataFim >= hoje)
            orderby b != null ? b.Descricao : null, u.Numero, u.IdUnidade
            select new ValueTuple<uint, string>(
                u.IdUnidade!.Value,
                FormatarDescricao(b != null ? b.Descricao : null, u.Numero)))
            .ToListAsync();
    }

    private static string FormatarDescricao(string? bloco, uint? numero)
    {
        var partes = new List<string>(2);
        if (!string.IsNullOrWhiteSpace(bloco))
            partes.Add(bloco.Trim());
        if (numero.HasValue)
            partes.Add($"Apto {numero}");
        return partes.Count > 0 ? string.Join(" — ", partes) : "Unidade";
    }

    private static async Task<AppDbContext> SeedMinhasUnidadesAsync()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(options, new TenantFixo(1));
        db.Condominio.Add(new Condominio { IdCondominio = 1, Nome = "Alpha" });
        db.Condominio.Add(new Condominio { IdCondominio = 2, Nome = "Beta" });
        db.Bloco.Add(new Bloco { IdBloco = 1, IdCondominio = 1, Descricao = "Torre A" });
        db.Bloco.Add(new Bloco { IdBloco = 2, IdCondominio = 2, Descricao = "Torre B" });
        db.Unidade.Add(new Unidade { IdUnidade = 101, IdCondominio = 1, IdBloco = 1, Numero = 101 });
        db.Unidade.Add(new Unidade { IdUnidade = 102, IdCondominio = 1, IdBloco = 1, Numero = 202 });
        db.Unidade.Add(new Unidade { IdUnidade = 201, IdCondominio = 2, IdBloco = 2, Numero = 10 });
        var inicio = new DateOnly(2024, 1, 1);
        db.PessoaUnidade.Add(new PessoaUnidade { IdPessoa = 20, IdUnidade = 101, DataInicio = inicio });
        db.PessoaUnidade.Add(new PessoaUnidade { IdPessoa = 20, IdUnidade = 102, DataInicio = inicio });
        db.PessoaUnidade.Add(new PessoaUnidade { IdPessoa = 20, IdUnidade = 201, DataInicio = inicio });
        db.Unidade.Add(new Unidade { IdUnidade = 103, IdCondominio = 1, IdBloco = 1, Numero = 303 });
        db.PessoaUnidade.Add(new PessoaUnidade
        {
            IdPessoa = 20,
            IdUnidade = 103,
            DataInicio = inicio,
            DataFim = new DateOnly(2020, 1, 1),
        });
        await db.SaveChangesAsync();
        return db;
    }

    private static Task<AppDbContext> VinculoLoginTests_SeedReuseAsync() =>
        SeedFromVinculoLogin();

    private static async Task<AppDbContext> SeedFromVinculoLogin()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(options, new TenantFixo());
        db.PerfilAcesso.Add(new PerfilAcesso { IdPerfil = 1, Descricao = "Administrador" });
        db.PerfilAcesso.Add(new PerfilAcesso { IdPerfil = 2, Descricao = "Morador" });
        db.PerfilAcesso.Add(new PerfilAcesso { IdPerfil = 3, Descricao = "Síndico" });
        db.Condominio.Add(new Condominio { IdCondominio = 1, Nome = "Alpha", Dominio = "alpha" });
        db.Unidade.Add(new Unidade { IdUnidade = 100, IdCondominio = 1 });
        db.PessoaCondominio.Add(new PessoaCondominio
        {
            IdPessoa = 11,
            IdCondominio = 1,
            IdPerfil = 1,
            DataInicio = new DateOnly(2024, 1, 1),
            TipoVinculo = 1,
        });
        db.PessoaUnidade.Add(new PessoaUnidade
        {
            IdPessoa = 11,
            IdUnidade = 100,
            TipoVinculo = 1,
            DataInicio = new DateOnly(2024, 1, 1),
        });
        await db.SaveChangesAsync();
        return db;
    }

    private sealed class TenantFixo : ICondominioContext
    {
        public TenantFixo(uint? id = null) => IdCondominio = id;

        public uint? IdCondominio { get; private set; }

        public void SetCondominio(uint idCondominio) => IdCondominio = idCondominio;

        public void Clear() => IdCondominio = null;

        public uint RequireTenantId() =>
            IdCondominio ?? throw new InvalidOperationException("Tenant não definido.");
    }
}