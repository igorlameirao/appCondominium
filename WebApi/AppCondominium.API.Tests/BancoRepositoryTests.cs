using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;
using AppCondominium.Infrastructure.Repositories.Generated;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace AppCondominium.API.Tests;

public class BancoRepositoryTests
{
    [Fact]
    public async Task GetByIdAsync_encontra_por_codigoBanco_string_com_zeros_a_esquerda()
    {
        await using var db = await CriarDbAsync();
        db.Banco.Add(new Banco
        {
            CodigoBanco = "001",
            DigitoVerificador = "0",
            Nome = "Banco Teste Zeros"
        });
        await db.SaveChangesAsync();

        var repo = new BancoRepository(db, new TenantMutavel(1));
        var found = await repo.GetByIdAsync("001");

        Assert.NotNull(found);
        Assert.Equal("001", found.CodigoBanco);
        Assert.Equal("Banco Teste Zeros", found.Nome);
    }

    [Fact]
    public async Task GetByIdAsync_nao_confunde_codigo_sem_zeros_com_armazenado_com_zeros()
    {
        await using var db = await CriarDbAsync();
        db.Banco.Add(new Banco { CodigoBanco = "001", DigitoVerificador = "0", Nome = "Com zeros" });
        await db.SaveChangesAsync();

        var repo = new BancoRepository(db, new TenantMutavel(1));
        var found = await repo.GetByIdAsync("1");

        Assert.Null(found);
    }

  private static async Task<AppDbContext> CriarDbAsync()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(options, new TenantMutavel(1));
        db.Condominio.Add(new Condominio { IdCondominio = 1, Nome = "Tenant" });
        await db.SaveChangesAsync();
        return db;
    }

    private sealed class TenantMutavel : ICondominioContext
    {
        private uint _id;
        public TenantMutavel(uint id) => _id = id;
        public uint? IdCondominio => _id;
        public void SetCondominio(uint idCondominio) => _id = idCondominio;
        public void Clear() => _id = 0;
        public uint RequireTenantId() => _id;
    }
}