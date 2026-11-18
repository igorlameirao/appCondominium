using System.Security.Claims;
using AppCondominium.API.Controllers;
using AppCondominium.Application.DTOs;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Domain.Notificacoes;
using AppCondominium.Infrastructure.Persistence;
using AppCondominium.Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace AppCondominium.API.Tests;

public class PreferenciaNotificacaoTests
{
    [Fact]
    public async Task Sem_registro_retorna_padroes_do_catalogo()
    {
        await using var ctx = await CriarContextoAsync();
        var service = new PreferenciaNotificacaoService(ctx.Db);

        var lista = await service.ListarAsync(42);

        Assert.Equal(2, lista.Count);
        Assert.All(lista, i =>
        {
            Assert.True(i.AtivoPush);
            Assert.True(i.AtivoEmail);
        });
    }

    [Fact]
    public async Task Salvar_persiste_e_atualiza_preferencias()
    {
        await using var ctx = await CriarContextoAsync();
        var service = new PreferenciaNotificacaoService(ctx.Db);

        var gravado = await service.SalvarAsync(42,
        [
            new PreferenciaNotificacaoAtualizacaoDto("ENCOMENDA_RECEBIDA", false, true),
            new PreferenciaNotificacaoAtualizacaoDto("ENCOMENDA_RETIRADA", true, false),
        ]);

        var recebida = gravado.Single(c => c.CodigoTipo == "ENCOMENDA_RECEBIDA");
        Assert.False(recebida.AtivoPush);
        Assert.True(recebida.AtivoEmail);

        var noBanco = await ctx.Db.PessoaPreferenciaNotificacao.CountAsync();
        Assert.Equal(2, noBanco);

        await service.SalvarAsync(42,
            [new PreferenciaNotificacaoAtualizacaoDto("ENCOMENDA_RECEBIDA", true, true)]);
        var atualizado = await ctx.Db.PessoaPreferenciaNotificacao
            .SingleAsync(p => p.CodigoTipo == "ENCOMENDA_RECEBIDA");
        Assert.True(atualizado.AtivoPush);
        Assert.True(atualizado.AtivoEmail);
    }

    [Fact]
    public async Task CanalAtivoAsync_respeita_valor_gravado()
    {
        await using var ctx = await CriarContextoAsync();
        var service = new PreferenciaNotificacaoService(ctx.Db);

        Assert.True(await service.CanalAtivoAsync(42, "ENCOMENDA_RECEBIDA", NotificacaoCanal.Push));

        await service.SalvarAsync(42,
            [new PreferenciaNotificacaoAtualizacaoDto("ENCOMENDA_RECEBIDA", false, true)]);

        Assert.False(await service.CanalAtivoAsync(42, "ENCOMENDA_RECEBIDA", NotificacaoCanal.Push));
        Assert.True(await service.CanalAtivoAsync(42, "ENCOMENDA_RECEBIDA", NotificacaoCanal.Email));
    }

    [Fact]
    public async Task Codigo_invalido_rejeita_gravacao()
    {
        await using var ctx = await CriarContextoAsync();
        var service = new PreferenciaNotificacaoService(ctx.Db);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.SalvarAsync(42, [new PreferenciaNotificacaoAtualizacaoDto("INVALIDO", true, true)]));
    }

    [Fact]
    public async Task Endpoint_exige_autenticacao()
    {
        await using var ctx = await CriarContextoAsync();
        var controller = CriarController(ctx);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity()),
            }
        };

        var resposta = await controller.ListarPreferenciasNotificacao(CancellationToken.None);
        Assert.IsType<UnauthorizedResult>(resposta.Result);
    }

    [Fact]
    public async Task Endpoint_grava_apenas_pessoa_do_jwt()
    {
        await using var ctx = await CriarContextoAsync();
        var controller = CriarController(ctx, "7");

        var body = new PreferenciaNotificacaoSalvarRequest(
        [
            new PreferenciaNotificacaoAtualizacaoDto("ENCOMENDA_RECEBIDA", false, false),
        ]);

        var resposta = await controller.SalvarPreferenciasNotificacao(body, CancellationToken.None);
        var ok = Assert.IsType<OkObjectResult>(resposta.Result);
        var dto = Assert.IsType<PreferenciaNotificacaoListaDto>(ok.Value);
        var recebida = dto.Categorias.Single(c => c.CodigoTipo == "ENCOMENDA_RECEBIDA");
        Assert.False(recebida.AtivoPush);
        Assert.False(recebida.AtivoEmail);

        var noBanco = await ctx.Db.PessoaPreferenciaNotificacao.SingleAsync();
        Assert.Equal(7u, noBanco.IdPessoa);
    }

    private static ContaController CriarController(TestContext ctx, string? idPessoa = null)
    {
        var controller = new ContaController(
            ctx.Db,
            ctx.Tenant,
            new StorageTestsPermissaoVazia(),
            new StorageTestsSenhaNula(),
            null!,
            null!,
            null!,
            new StorageTestsEmailSenderVazio(),
            new PreferenciaNotificacaoService(ctx.Db),
            Microsoft.Extensions.Logging.Abstractions.NullLogger<ContaController>.Instance);

        if (idPessoa is not null)
        {
            controller.ControllerContext = new Microsoft.AspNetCore.Mvc.ControllerContext
            {
                HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                        [new Claim(ClaimTypes.NameIdentifier, idPessoa)],
                        "test"))
                }
            };
        }

        return controller;
    }

    private static async Task<TestContext> CriarContextoAsync()
    {
        var tenant = new TestTenant();
        tenant.SetCondominio(1);
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(options, tenant);
        db.Pessoa.Add(new Pessoa { IdPessoa = 7, Nome = "Teste" });
        await db.SaveChangesAsync();
        return new TestContext(db, tenant);
    }

    private sealed class TestContext(AppDbContext db, TestTenant tenant) : IAsyncDisposable
    {
        public AppDbContext Db { get; } = db;
        public TestTenant Tenant { get; } = tenant;

        public ValueTask DisposeAsync() => Db.DisposeAsync();
    }

    private sealed class TestTenant : ICondominioContext
    {
        public uint? IdCondominio { get; private set; }
        public void SetCondominio(uint id) => IdCondominio = id;
        public void Clear() => IdCondominio = null;
        public uint RequireTenantId() => IdCondominio ?? throw new InvalidOperationException();
    }

    private sealed class StorageTestsPermissaoVazia : IPermissionResolver
    {
        public Task<bool> HasAsync(uint idPessoa, uint idCondominio, string permissionKey, string acao, CancellationToken ct = default) =>
            Task.FromResult(false);
        public Task<AppCondominium.Application.Authorization.PermissionSnapshot> SnapshotAsync(uint idPessoa, uint idCondominio, CancellationToken ct = default) =>
            throw new NotSupportedException();
        public Task<IReadOnlyList<AppCondominium.Application.Authorization.PermissaoLinha>> MatrizPerfilAsync(uint idPerfil, CancellationToken ct = default) =>
            throw new NotSupportedException();
        public Task SaveMatrizPerfilAsync(uint idPerfil, IReadOnlyList<AppCondominium.Application.Authorization.PermissaoLinha> linhas, CancellationToken ct = default) =>
            throw new NotSupportedException();
        public Task<IReadOnlyList<AppCondominium.Application.Authorization.PermissaoLinha>> ExcecoesAsync(uint idPessoa, uint idCondominio, CancellationToken ct = default) =>
            throw new NotSupportedException();
        public Task SaveExcecoesAsync(uint idPessoa, uint idCondominio, IReadOnlyList<AppCondominium.Application.Authorization.PermissaoLinha> linhas, CancellationToken ct = default) =>
            throw new NotSupportedException();
    }

    private sealed class StorageTestsSenhaNula : IPasswordHasher
    {
        public string Hash(string password) => password;
        public bool Verify(string password, string stored) => password == stored;
    }

    private sealed class StorageTestsEmailSenderVazio : IEmailSender
    {
        public Task<long> EnviarAsync(EmailMessage mensagem, CancellationToken ct = default) => Task.FromResult(0L);
    }
}