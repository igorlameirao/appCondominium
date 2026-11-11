using System.Security.Claims;
using AppCondominium.API.Authorization;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;
using AppCondominium.Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace AppCondominium.API.Tests;

public class RbacTests
{
    [Fact]
    public async Task Morador_com_somente_visualizar_nao_inclui_e_excecao_fica_no_condominio()
    {
        var tenant = new MutableTenant();
        await using var db = await SeedAsync(tenant);

        var resolver = new PermissionResolver(db);
        Assert.True(await resolver.HasAsync(5, 1, "BLOCO", "Visualizar"));
        Assert.False(await resolver.HasAsync(5, 1, "BLOCO", "Incluir"));
        Assert.True(await resolver.HasAsync(5, 1, "BLOCO", "Alterar"));
        Assert.False(await resolver.HasAsync(5, 2, "BLOCO", "Alterar"));

        var condo1 = await resolver.SnapshotAsync(5, 1);
        var condo2 = await resolver.SnapshotAsync(5, 2);
        Assert.Contains("BLOCO:Alterar", condo1.Permissoes);
        Assert.DoesNotContain("BLOCO:Alterar", condo2.Permissoes);
        Assert.NotEqual(condo1.Permissoes, condo2.Permissoes);
    }

    [Fact]
    public async Task Administrador_tem_acesso_total_so_no_proprio_condominio_e_nao_le_bloco_alheio()
    {
        var tenant = new MutableTenant();
        await using var db = await SeedAsync(tenant);
        var resolver = new PermissionResolver(db);

        Assert.True(await resolver.HasAsync(9, 1, "BLOCO", "Excluir"));
        var snap = await resolver.SnapshotAsync(9, 1);
        Assert.True(snap.AcessoTotal);
        Assert.Equal("Administrador", snap.Perfil);

        var outro = await resolver.SnapshotAsync(9, 2);
        Assert.False(outro.AcessoTotal);

        tenant.SetCondominio(1);
        var blocos = await db.Bloco.Select(b => b.IdBloco).ToListAsync();
        Assert.Equal(new uint?[] { 1 }, blocos);
    }

    [Fact]
    public void Filtro_usa_claims_do_token_sem_consultar_banco()
    {
        var tenant = new MutableTenant();
        tenant.SetCondominio(1);
        var services = new ServiceCollection();
        services.AddSingleton<ICondominioContext>(tenant);
        services.AddSingleton<IPermissionResolver>(new NegarResolver());
        var http = new DefaultHttpContext { RequestServices = services.BuildServiceProvider() };
        http.Request.Method = "GET";
        http.User = new ClaimsPrincipal(new ClaimsIdentity(
            [
                new Claim(ClaimTypes.NameIdentifier, "5"),
                new Claim(PermissionClaimTypes.Permissao, "BLOCO:Visualizar")
            ],
            authenticationType: "test"));

        var ctx = new AuthorizationFilterContext(
            new ActionContext(http, new RouteData(), new ActionDescriptor()),
            new List<IFilterMetadata>());

        new PermissionResourceAttribute("BLOCO").OnAuthorizationAsync(ctx).GetAwaiter().GetResult();

        Assert.Null(ctx.Result);
    }

    [Fact]
    public async Task Filtro_responde_403_quando_a_acao_do_verbo_nao_e_permitida()
    {
        var tenant = new MutableTenant();
        tenant.SetCondominio(1);
        var services = new ServiceCollection();
        services.AddSingleton<ICondominioContext>(tenant);
        services.AddSingleton<IPermissionResolver>(new NegarResolver());
        var http = new DefaultHttpContext { RequestServices = services.BuildServiceProvider() };
        http.Request.Method = "POST";
        http.User = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, "5")],
            authenticationType: "test"));

        var ctx = new AuthorizationFilterContext(
            new ActionContext(http, new RouteData(), new ActionDescriptor()),
            new List<IFilterMetadata>());

        await new PermissionResourceAttribute("BLOCO").OnAuthorizationAsync(ctx);

        var result = Assert.IsType<ObjectResult>(ctx.Result);
        Assert.Equal(StatusCodes.Status403Forbidden, result.StatusCode);
        Assert.Equal("Incluir", PermissionResourceAttribute.AcaoDoVerbo("POST"));
    }

    private static async Task<AppDbContext> SeedAsync(MutableTenant tenant)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(options, tenant);
        db.PerfilAcesso.Add(new PerfilAcesso { IdPerfil = 1, Descricao = "Administrador" });
        db.PerfilAcesso.Add(new PerfilAcesso { IdPerfil = 2, Descricao = "Morador" });
        db.PermissionKey.Add(new PermissionKey { IdPermissionKey = 1, Chave = "BLOCO", Nome = "Bloco", Modulo = "Condominio" });
        db.PerfilPermissao.Add(new PerfilPermissao
        {
            IdPerfil = 2,
            IdPermissionKey = 1,
            Visualizar = true
        });
        db.PessoaCondominio.Add(new PessoaCondominio { IdPessoa = 5, IdCondominio = 1, IdPerfil = 2, DataInicio = new DateOnly(2024, 1, 1), TipoVinculo = 1 });
        db.PessoaCondominio.Add(new PessoaCondominio { IdPessoa = 5, IdCondominio = 2, IdPerfil = 2, DataInicio = new DateOnly(2024, 1, 1), TipoVinculo = 1 });
        db.PessoaCondominio.Add(new PessoaCondominio { IdPessoa = 9, IdCondominio = 1, IdPerfil = 1, DataInicio = new DateOnly(2024, 1, 1), TipoVinculo = 1 });
        db.PessoaCondominio.Add(new PessoaCondominio { IdPessoa = 9, IdCondominio = 2, IdPerfil = 2, DataInicio = new DateOnly(2024, 1, 1), TipoVinculo = 1 });
        db.PessoaPermissaoExcecao.Add(new PessoaPermissaoExcecao
        {
            IdPessoa = 5,
            IdCondominio = 1,
            IdPermissionKey = 1,
            Visualizar = true,
            Alterar = true
        });
        db.Bloco.Add(new Bloco { IdBloco = 1, IdCondominio = 1, Descricao = "A" });
        db.Bloco.Add(new Bloco { IdBloco = 2, IdCondominio = 2, Descricao = "B" });
        await db.SaveChangesAsync();
        return db;
    }

    private sealed class NegarResolver : IPermissionResolver
    {
        public Task<bool> HasAsync(uint idPessoa, uint idCondominio, string permissionKey, string acao, CancellationToken ct = default)
            => Task.FromResult(false);

        public Task<Application.Authorization.PermissionSnapshot> SnapshotAsync(uint idPessoa, uint idCondominio, CancellationToken ct = default)
            => Task.FromResult(new Application.Authorization.PermissionSnapshot(false, "Morador", Array.Empty<string>()));

        public Task<IReadOnlyList<Application.Authorization.PermissaoLinha>> MatrizPerfilAsync(uint idPerfil, CancellationToken ct = default)
            => Task.FromResult<IReadOnlyList<Application.Authorization.PermissaoLinha>>([]);

        public Task SaveMatrizPerfilAsync(uint idPerfil, IReadOnlyList<Application.Authorization.PermissaoLinha> linhas, CancellationToken ct = default)
            => Task.CompletedTask;

        public Task<IReadOnlyList<Application.Authorization.PermissaoLinha>> ExcecoesAsync(uint idPessoa, uint idCondominio, CancellationToken ct = default)
            => Task.FromResult<IReadOnlyList<Application.Authorization.PermissaoLinha>>([]);

        public Task SaveExcecoesAsync(uint idPessoa, uint idCondominio, IReadOnlyList<Application.Authorization.PermissaoLinha> linhas, CancellationToken ct = default)
            => Task.CompletedTask;
    }

    private sealed class MutableTenant : ICondominioContext
    {
        public uint? IdCondominio { get; private set; }
        public void SetCondominio(uint idCondominio) => IdCondominio = idCondominio;
        public void Clear() => IdCondominio = null;
        public uint RequireTenantId() => IdCondominio ?? throw new InvalidOperationException();
    }
}
