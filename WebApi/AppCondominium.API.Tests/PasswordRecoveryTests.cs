using AppCondominium.Application.Interfaces;
using AppCondominium.Application.RecuperacaoSenha;
using AppCondominium.Domain.Entities;
using AppCondominium.Domain.RecuperacaoSenha;
using AppCondominium.Domain.Vinculos;
using AppCondominium.Infrastructure.Persistence;
using AppCondominium.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

namespace AppCondominium.API.Tests;

public class PasswordRecoveryTests
{
    [Fact]
    public async Task Solicitar_retorna_mensagem_generica_e_invalida_tokens_anteriores()
    {
        await using var db = await SeedBaseAsync();
        var svc = CreateService(db);

        var r1 = await svc.SolicitarAsync("usuario@example.com");
        Assert.Contains("Se o e-mail estiver cadastrado", r1.Mensagem);
        var token1 = FakeRecoveryEmailSender.UltimoToken
            ?? throw new InvalidOperationException("Token ausente.");

        db.RecuperacaoSenhaToken.Add(new RecuperacaoSenhaToken
        {
            IdPessoa = 20,
            TokenHash = "hash-antigo-manual",
            EmailNormalizado = "usuario@example.com",
            DataCriacao = DateTime.UtcNow,
            DataExpiracao = DateTime.UtcNow.AddMinutes(30),
            Estado = RecuperacaoSenhaEstado.Pendente
        });
        await db.SaveChangesAsync();

        _ = await svc.SolicitarAsync("usuario@example.com");
        var token2 = FakeRecoveryEmailSender.UltimoToken
            ?? throw new InvalidOperationException("Token ausente.");
        Assert.NotEqual(token1, token2);

        var invalidados = await db.RecuperacaoSenhaToken
            .Where(t => t.TokenHash == "hash-antigo-manual")
            .Select(t => t.Estado)
            .FirstAsync();
        Assert.Equal(RecuperacaoSenhaEstado.Invalidado, invalidados);
    }

    [Fact]
    public async Task Redefinir_consome_token_e_nao_reutiliza()
    {
        await using var db = await SeedBaseAsync();
        var svc = CreateService(db);

        await svc.SolicitarAsync("usuario@example.com");
        var token = FakeRecoveryEmailSender.UltimoToken
            ?? throw new InvalidOperationException("Token ausente.");

        Assert.True((await svc.ValidarTokenAsync(token)).Valido);

        var ok = await svc.RedefinirAsync(new RedefinirSenhaRecuperacaoRequest(token, "NovaSenha8!"));
        Assert.True(ok.Sucesso);

        var hashDepois = (await db.Pessoafisica.IgnoreQueryFilters().FirstAsync(p => p.IdPessoa == 20)).Senha;
        Assert.NotEqual("hash-antiga", hashDepois);

        var segundo = await svc.RedefinirAsync(new RedefinirSenhaRecuperacaoRequest(token, "OutraSenha9!"));
        Assert.False(segundo.Sucesso);
    }

    [Fact]
    public async Task Email_inexistente_retorna_mesma_mensagem_generica()
    {
        await using var db = await SeedBaseAsync();
        var svc = CreateService(db);
        var r = await svc.SolicitarAsync("naoexiste@example.com");
        Assert.Contains("Se o e-mail estiver cadastrado", r.Mensagem);
        Assert.Equal(0, await db.RecuperacaoSenhaToken.CountAsync());
    }

    private static IPasswordRecoveryService CreateService(AppDbContext db)
    {
        return new PasswordRecoveryService(
            db,
            new PasswordHasher(),
            new FakeRecoveryEmailSender(),
            Options.Create(new PasswordRecoveryOptions
            {
                ValidadeMinutos = 30,
                RedefinirBaseUrl = "https://test/recuperacao-senha/redefinir"
            }),
            NullLogger<PasswordRecoveryService>.Instance);
    }

    private static async Task<AppDbContext> SeedBaseAsync()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        var db = new AppDbContext(options, new TenantStub());
        db.Pessoa.Add(new Pessoa { IdPessoa = 20, CPFCNPJ = "39053344705", Nome = "Usuario Teste" });
        db.Pessoafisica.Add(new Pessoafisica
        {
            IdPessoa = 20,
            Email = "usuario@example.com",
            Senha = "hash-antiga"
        });
        db.Condominio.Add(new Condominio { IdCondominio = 1, Nome = "Alpha", Dominio = "alpha" });
        db.PessoaVinculo.Add(new PessoaVinculo
        {
            IdPessoa = 20,
            IdCondominio = 1,
            CodigoPapelVinculo = PapelVinculoCodigos.Morador,
            IdPerfil = 2,
            DataInicio = PessoaVinculoAtivo.HojeUtc(),
            Responsavel = 0
        });
        await db.SaveChangesAsync();
        return db;
    }

    private sealed class TenantStub : ICondominioContext
    {
        public uint? IdCondominio => null;
        public void SetCondominio(uint idCondominio) { }
        public void Clear() { }
        public uint RequireTenantId() => throw new InvalidOperationException("Sem tenant.");
    }

    private sealed class FakeRecoveryEmailSender : IEmailSender
    {
        public static string? UltimoToken;

        public Task<long> EnviarAsync(EmailMessage mensagem, CancellationToken ct = default)
        {
            var idx = mensagem.CorpoHtml.IndexOf("token=", StringComparison.Ordinal);
            if (idx >= 0)
            {
                var sub = mensagem.CorpoHtml[(idx + 6)..];
                var end = sub.IndexOf('"');
                if (end < 0) end = sub.IndexOf('&');
                if (end < 0) end = sub.Length;
                UltimoToken = Uri.UnescapeDataString(sub[..end]);
            }
            return Task.FromResult(1L);
        }
    }
}