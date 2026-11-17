using AppCondominium.Domain.Entities;
using AppCondominium.Domain.Vinculos;
using AppCondominium.Infrastructure.Persistence;
using AppCondominium.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace AppCondominium.API.Tests;

public class PessoaVinculoPfPjTests
{
    [Fact]
    public async Task Pessoa_juridica_nao_pode_morador()
    {
        await using var db = await Criar();
        var svc = new PessoaVinculoService(db, new Tenant(1));
        var vinculo = new PessoaVinculo
        {
            IdPessoa = 5,
            CodigoPapelVinculo = PapelVinculoCodigos.Morador,
            IdCondominio = 1,
            IdUnidade = 10,
            DataInicio = new DateOnly(2024, 1, 1),
            Responsavel = 0
        };

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => svc.ValidarAntesGravarAsync(vinculo, true));
        Assert.Contains("Pessoa jurídica", ex.Message);
    }

    [Fact]
    public async Task Pessoa_juridica_pode_fornecedor()
    {
        await using var db = await Criar();
        var svc = new PessoaVinculoService(db, new Tenant(1));
        var vinculo = new PessoaVinculo
        {
            IdPessoa = 5,
            CodigoPapelVinculo = PapelVinculoCodigos.Fornecedor,
            IdCondominio = 1,
            DataInicio = new DateOnly(2024, 1, 1),
            Responsavel = 0
        };

        await svc.ValidarAntesGravarAsync(vinculo, true);
    }

    [Fact]
    public async Task Papel_excluido_nao_entra_em_aberto()
    {
        await using var db = await Criar();
        var svc = new PessoaVinculoService(db, new Tenant(1));
        var vinculo = new PessoaVinculo
        {
            IdPessoa = 6,
            CodigoPapelVinculo = PapelVinculoCodigos.DependenteUnidade,
            IdCondominio = 1,
            IdUnidade = 10,
            DataInicio = new DateOnly(2024, 1, 1),
            Responsavel = 0
        };

        await Assert.ThrowsAsync<InvalidOperationException>(() => svc.ValidarAntesGravarAsync(vinculo, true));
    }

    private static async Task<AppDbContext> Criar()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new AppDbContext(options, new Tenant(1));
        db.Condominio.Add(new Condominio { IdCondominio = 1, Nome = "A" });
        db.Unidade.Add(new Unidade { IdUnidade = 10, IdCondominio = 1, Numero = 1 });
        db.PapelVinculo.Add(new PapelVinculo { CodigoPapelVinculo = PapelVinculoCodigos.Morador, Descricao = "Morador", EscopoPapel = EscopoPapelVinculo.Unidade });
        db.PapelVinculo.Add(new PapelVinculo { CodigoPapelVinculo = PapelVinculoCodigos.Fornecedor, Descricao = "Fornecedor", EscopoPapel = EscopoPapelVinculo.Condominio });
        db.PapelVinculo.Add(new PapelVinculo { CodigoPapelVinculo = PapelVinculoCodigos.DependenteUnidade, Descricao = "Dependente", EscopoPapel = EscopoPapelVinculo.Unidade });
        db.Pessoa.Add(new Pessoa { IdPessoa = 5, Nome = "Empresa", CPFCNPJ = "11222333000181" });
        db.Pessoa.Add(new Pessoa { IdPessoa = 6, Nome = "Ana", CPFCNPJ = "39053344705" });
        db.PessoaJuridica.Add(new PessoaJuridica { IdPessoa = 5, NomeFantasia = "Empresa" });
        db.Pessoafisica.Add(new Pessoafisica { IdPessoa = 6, DataNascimento = new DateOnly(1990, 1, 1) });
        await db.SaveChangesAsync();
        return db;
    }

    private sealed class Tenant : Application.Interfaces.ICondominioContext
    {
        public Tenant(uint id) => IdCondominio = id;
        public uint? IdCondominio { get; private set; }
        public void Clear() => IdCondominio = 0;
        public uint RequireTenantId() => IdCondominio ?? 0;
        public void SetCondominio(uint idCondominio) => IdCondominio = idCondominio;
    }
}
