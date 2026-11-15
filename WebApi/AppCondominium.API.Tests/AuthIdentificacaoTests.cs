using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;
using AppCondominium.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace AppCondominium.API.Tests;

public class AuthIdentificacaoTests
{
    private const string SenhaPlana = "Senha@123";
    private const string CpfValido = "52998224725";
    private const string CpfMascarado = "529.982.247-25";

    [Fact]
    public async Task Login_por_email_resolve_pessoa()
    {
        await using var db = await SeedAuthAsync();
        var svc = new UsuarioIdentificacaoService(db);
        var pf = await svc.ResolverPessoafisicaPorUsuarioAsync("maria@exemplo.com", default);
        Assert.NotNull(pf);
        Assert.Equal(1u, pf!.IdPessoa);
    }

    [Fact]
    public async Task Login_por_cpf_sem_mascara_resolve_pessoa()
    {
        await using var db = await SeedAuthAsync();
        var svc = new UsuarioIdentificacaoService(db);
        var pf = await svc.ResolverPessoafisicaPorUsuarioAsync(CpfValido, default);
        Assert.NotNull(pf);
        Assert.Equal(2u, pf!.IdPessoa);
    }

    [Fact]
    public async Task Login_por_cpf_com_mascara_resolve_pessoa()
    {
        await using var db = await SeedAuthAsync();
        var svc = new UsuarioIdentificacaoService(db);
        var pf = await svc.ResolverPessoafisicaPorUsuarioAsync(CpfMascarado, default);
        Assert.NotNull(pf);
        Assert.Equal(2u, pf!.IdPessoa);
    }

    [Fact]
    public async Task Cpf_invalido_nao_resolve_pessoa()
    {
        await using var db = await SeedAuthAsync();
        var svc = new UsuarioIdentificacaoService(db);
        var pf = await svc.ResolverPessoafisicaPorUsuarioAsync("111.111.111-11", default);
        Assert.Null(pf);
    }

    [Fact]
    public async Task Senha_incorreta_falha_verificacao()
    {
        await using var db = await SeedAuthAsync();
        var svc = new UsuarioIdentificacaoService(db);
        var hasher = new PasswordHasher();
        var pf = await svc.ResolverPessoafisicaPorUsuarioAsync("maria@exemplo.com", default);
        Assert.NotNull(pf);
        Assert.False(hasher.Verify("errada", pf!.Senha!));
    }

    [Fact]
    public async Task Pessoa_sem_cpf_nao_resolve_por_cpf_inexistente()
    {
        await using var db = await SeedAuthAsync();
        var svc = new UsuarioIdentificacaoService(db);
        var pf = await svc.ResolverPessoafisicaPorUsuarioAsync("00000000191", default);
        Assert.Null(pf);
    }

    [Fact]
    public async Task Condominios_por_usuario_aceita_cpf()
    {
        await using var db = await SeedAuthAsync();
        var svc = new UsuarioIdentificacaoService(db);
        var id = await svc.ResolverIdPessoaPorUsuarioAsync(CpfMascarado, default);
        Assert.Equal(2u, id);
    }

    private static async Task<AppDbContext> SeedAuthAsync()
    {
        var hasher = new PasswordHasher();
        var hash = hasher.Hash(SenhaPlana);
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(options, new TenantFixoAuth());

        db.Pessoa.Add(new Pessoa { IdPessoa = 1, Nome = "Maria", CPFCNPJ = "11144477735" });
        db.Pessoafisica.Add(new Pessoafisica { IdPessoa = 1, Email = "maria@exemplo.com", Senha = hash });

        db.Pessoa.Add(new Pessoa { IdPessoa = 2, Nome = "João", CPFCNPJ = CpfValido });
        db.Pessoafisica.Add(new Pessoafisica { IdPessoa = 2, Email = "joao@exemplo.com", Senha = hash });

        db.Pessoa.Add(new Pessoa { IdPessoa = 3, Nome = "Sem Doc", CPFCNPJ = "" });
        db.Pessoafisica.Add(new Pessoafisica { IdPessoa = 3, Email = "semcpf@exemplo.com", Senha = hash });

        await db.SaveChangesAsync();
        return db;
    }

    private sealed class TenantFixoAuth : ICondominioContext
    {
        public uint? IdCondominio => null;
        public void SetCondominio(uint idCondominio) { }
        public void Clear() { }
        public uint RequireTenantId() => throw new InvalidOperationException();
    }
}