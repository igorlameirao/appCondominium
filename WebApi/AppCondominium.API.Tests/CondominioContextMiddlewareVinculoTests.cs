using System.Security.Claims;
using AppCondominium.API.Middleware;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;
using AppCondominium.Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace AppCondominium.API.Tests;

public class CondominioContextMiddlewareVinculoTests
{
    [Fact]
    public async Task Jwt_valido_sem_vinculo_ativo_retorna_403()
    {
        await using var db = await SeedAsync();
        var access = new TenantAccessService(db);
        var ctx = new CondominioContext();
        var chamado = false;

        RequestDelegate next = _ =>
        {
            chamado = true;
            return Task.CompletedTask;
        };

        var middleware = new CondominioContextMiddleware(next);
        var http = new DefaultHttpContext();
        http.Request.Path = "/api/bloco";
        http.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "6"),
            new Claim("idCondominio", "1")
        }, authenticationType: "Bearer"));

        await middleware.InvokeAsync(http, ctx, access);

        Assert.False(chamado);
        Assert.Equal(StatusCodes.Status403Forbidden, http.Response.StatusCode);
    }

    [Fact]
    public async Task Jwt_valido_com_vinculo_ativo_prossegue()
    {
        await using var db = await SeedAsync();
        var access = new TenantAccessService(db);
        var ctx = new CondominioContext();
        var chamado = false;

        RequestDelegate next = _ =>
        {
            chamado = true;
            return Task.CompletedTask;
        };

        var middleware = new CondominioContextMiddleware(next);
        var http = new DefaultHttpContext();
        http.Request.Path = "/api/bloco";
        http.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim("idCondominio", "1")
        }, authenticationType: "Bearer"));

        await middleware.InvokeAsync(http, ctx, access);

        Assert.True(chamado);
        Assert.Equal(1u, ctx.IdCondominio);
    }

    private static async Task<AppDbContext> SeedAsync()
    {
        var hoje = DateOnly.FromDateTime(DateTime.UtcNow);
        var ontem = hoje.AddDays(-1);

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(options, new TenantFixoMw());

        db.Condominio.Add(new Condominio { IdCondominio = 1, Nome = "Alpha" });
        db.Unidade.Add(new Unidade { IdUnidade = 10, IdCondominio = 1 });

        db.PessoaCondominio.Add(new PessoaCondominio
        {
            IdPessoa = 1, IdCondominio = 1, IdPerfil = 1,
            DataInicio = ontem, DataFim = null, TipoVinculo = 1
        });

        db.PessoaCondominio.Add(new PessoaCondominio
        {
            IdPessoa = 6, IdCondominio = 1, IdPerfil = 1,
            DataInicio = ontem, DataFim = ontem, TipoVinculo = 1
        });

        await db.SaveChangesAsync();
        return db;
    }

    private sealed class TenantFixoMw : ICondominioContext
    {
        public uint? IdCondominio => null;
        public void SetCondominio(uint idCondominio) { }
        public void Clear() { }
        public uint RequireTenantId() => throw new InvalidOperationException();
    }
}