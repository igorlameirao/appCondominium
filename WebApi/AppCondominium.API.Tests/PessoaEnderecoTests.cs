using AppCondominium.Application.DTOs;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;
using AppCondominium.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace AppCondominium.API.Tests;

public class PessoaEnderecoTests
{
    [Fact]
    public async Task Novo_principal_rebaixa_anterior()
    {
        await using var db = await CriarDbComPessoaVinculo();
        var svc = new PessoaEnderecoService(db);

        await svc.GravarAsync(10, new PessoaEnderecoUpsertRequest
        {
            Logradouro = "Rua A",
            CEP = "01310100",
            IdBairro = 1,
            TipoEndereco = 0,
            NumeroEndereco = 100
        });

        await svc.GravarAsync(10, new PessoaEnderecoUpsertRequest
        {
            Logradouro = "Rua B",
            CEP = "01310101",
            IdBairro = 1,
            TipoEndereco = 0,
            NumeroEndereco = 200
        });

        var lista = await svc.ListarPorPessoaAsync(10);
        Assert.Equal(2, lista.Count);
        Assert.Single(lista, x => x.TipoEndereco == 0 && x.Logradouro == "Rua B");
        Assert.Single(lista, x => x.TipoEndereco == 1 && x.Logradouro == "Rua A");
    }

    [Fact]
    public async Task Grava_endereco_para_pessoa_sem_vinculo_no_condominio()
    {
        await using var db = await CriarDbPessoaSemVinculo();
        var svc = new PessoaEnderecoService(db);

        var item = await svc.GravarAsync(10, new PessoaEnderecoUpsertRequest
        {
            Logradouro = "Rua Nova",
            CEP = "01310100",
            IdBairro = 1,
            TipoEndereco = 0,
            NumeroEndereco = 10
        });

        Assert.Equal("Rua Nova", item.Logradouro);
        var lista = await svc.ListarPorPessoaAsync(10);
        Assert.Single(lista);
    }

    [Fact]
    public async Task Nao_permite_inativar_unico_principal()
    {
        await using var db = await CriarDbComPessoaVinculo();
        var svc = new PessoaEnderecoService(db);
        var item = await svc.GravarAsync(10, new PessoaEnderecoUpsertRequest
        {
            Logradouro = "Rua A",
            IdBairro = 1,
            TipoEndereco = 0
        });

        await Assert.ThrowsAsync<InvalidOperationException>(() => svc.GravarAsync(10, new PessoaEnderecoUpsertRequest
        {
            IdEndereco = item.IdEndereco,
            TipoEndereco = 2
        }));
    }

    private static async Task<AppDbContext> CriarDbPessoaSemVinculo()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var tenant = new TenantMutavel(1);
        var db = new AppDbContext(options, tenant);
        db.Condominio.Add(new Condominio { IdCondominio = 1, Nome = "A" });
        db.Pessoa.Add(new Pessoa { IdPessoa = 10, Nome = "Nova", CPFCNPJ = "39053344705" });
        db.Set<Bairro>().Add(new Bairro { IdBairro = 1, Nome = "Centro", CodigoIBGEMunicipio = 3550308 });
        await db.SaveChangesAsync();
        return db;
    }

    private static async Task<AppDbContext> CriarDbComPessoaVinculo()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var tenant = new TenantMutavel(1);
        var db = new AppDbContext(options, tenant);
        db.Condominio.Add(new Condominio { IdCondominio = 1, Nome = "A" });
        db.Pessoa.Add(new Pessoa { IdPessoa = 10, Nome = "Teste", CPFCNPJ = "39053344705" });
        db.PessoaVinculo.Add(new PessoaVinculo
        {
            IdVinculo = 1,
            IdPessoa = 10,
            IdCondominio = 1,
            CodigoPapelVinculo = 1,
            DataInicio = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1))
        });
        db.Set<Bairro>().Add(new Bairro { IdBairro = 1, Nome = "Centro", CodigoIBGEMunicipio = 3550308 });
        await db.SaveChangesAsync();
        return db;
    }

    private sealed class TenantMutavel : Application.Interfaces.ICondominioContext
    {
        private uint _id;
        public TenantMutavel(uint id) => _id = id;
        public uint? IdCondominio => _id;
        public void Clear() => _id = 0;
        public uint RequireTenantId() => _id;
        public void SetCondominio(uint idCondominio) => _id = idCondominio;
    }
}