using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;
using AppCondominium.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace AppCondominium.API.Tests;

public class PessoaConsultaTenantTests
{
    [Fact]
    public async Task Por_documento_sem_tenant_retorna_null_sem_permitir_cadastro()
    {
        await using var db = await CriarDb();
        var tenant = new TenantMutavel(1);
        var svc = new PessoaConsultaService(db, tenant);

        db.Pessoa.Add(new Pessoa { IdPessoa = 99, Nome = "Fora", CPFCNPJ = "39053344705" });
        await db.SaveChangesAsync();

        var r = await svc.ObterPorDocumentoAsync("39053344705", permitirCadastroGlobal: false);
        Assert.Null(r);
    }

    [Fact]
    public async Task Por_documento_com_flag_cadastro_retorna_mesmo_fora_do_tenant()
    {
        await using var db = await CriarDb();
        var tenant = new TenantMutavel(1);
        var svc = new PessoaConsultaService(db, tenant);

        db.Pessoa.Add(new Pessoa { IdPessoa = 99, Nome = "Fora", CPFCNPJ = "39053344705" });
        db.Pessoafisica.Add(new Pessoafisica { IdPessoa = 99, DataNascimento = new DateOnly(1990, 1, 1) });
        await db.SaveChangesAsync();

        var r = await svc.ObterPorDocumentoAsync("39053344705", permitirCadastroGlobal: true);
        Assert.NotNull(r);
        Assert.Equal(99u, r!.IdPessoa);
    }

    [Fact]
    public async Task Lista_contextual_retorna_somente_papel_e_escopo()
    {
        await using var db = await CriarDb();
        var tenant = new TenantMutavel(1);
        var svc = new PessoaConsultaService(db, tenant);
        db.Pessoa.Add(new Pessoa { IdPessoa = 1, Nome = "Morador Um", CPFCNPJ = "39053344705" });
        db.Pessoa.Add(new Pessoa { IdPessoa = 2, Nome = "Sindico", CPFCNPJ = "15350946056" });
        db.Pessoafisica.Add(new Pessoafisica { IdPessoa = 1, DataNascimento = new DateOnly(1990, 1, 1) });
        db.Pessoafisica.Add(new Pessoafisica { IdPessoa = 2, DataNascimento = new DateOnly(1980, 1, 1) });
        db.Unidade.Add(new Unidade { IdUnidade = 10, IdCondominio = 1, Numero = 101 });
        db.PapelVinculo.Add(new PapelVinculo { CodigoPapelVinculo = 2, Descricao = "Morador", EscopoPapel = 2 });
        db.PessoaVinculo.Add(new PessoaVinculo
        {
            IdPessoa = 1, IdCondominio = 1, CodigoPapelVinculo = 2, IdUnidade = 10,
            DataInicio = new DateOnly(2024, 1, 1), Responsavel = 0
        });
        db.PessoaVinculo.Add(new PessoaVinculo
        {
            IdPessoa = 2, IdCondominio = 1, CodigoPapelVinculo = 10,
            DataInicio = new DateOnly(2024, 1, 1), Responsavel = 0
        });
        await db.SaveChangesAsync();

        var lista = await svc.ListarAsync(1, 20, null, "PF", null, "unidade", new uint[] { 2 }, true);
        var item = Assert.Single(lista.Items);
        Assert.Equal(1u, item.IdPessoa);
        Assert.Equal("Morador", item.PapelResumo);
        Assert.Equal("Unidade 101", item.UnidadeResumo);
    }

    [Fact]
    public async Task Lista_gestores_retorna_somente_vinculos_de_gestao_com_tipo()
    {
        await using var db = await CriarDb();
        var tenant = new TenantMutavel(1);
        var svc = new PessoaConsultaService(db, tenant);
        db.Pessoa.Add(new Pessoa { IdPessoa = 1, Nome = "Ana Gestora", CPFCNPJ = "39053344705" });
        db.Pessoa.Add(new Pessoa { IdPessoa = 2, Nome = "Bruno Fornecedor", CPFCNPJ = "15350946056" });
        db.Pessoafisica.Add(new Pessoafisica { IdPessoa = 1, DataNascimento = new DateOnly(1990, 1, 1) });
        db.Pessoafisica.Add(new Pessoafisica { IdPessoa = 2, DataNascimento = new DateOnly(1980, 1, 1) });
        db.PapelVinculo.Add(new PapelVinculo { CodigoPapelVinculo = 10, Descricao = "Síndico", EscopoPapel = 1 });
        db.PapelVinculo.Add(new PapelVinculo { CodigoPapelVinculo = 12, Descricao = "Conselheiro", EscopoPapel = 1 });
        db.PapelVinculo.Add(new PapelVinculo { CodigoPapelVinculo = 17, Descricao = "Fornecedor", EscopoPapel = 1 });
        db.PessoaVinculo.Add(new PessoaVinculo
        {
            IdPessoa = 1, IdCondominio = 1, CodigoPapelVinculo = 10,
            DataInicio = new DateOnly(2024, 1, 1), Responsavel = 0
        });
        db.PessoaVinculo.Add(new PessoaVinculo
        {
            IdPessoa = 1, IdCondominio = 1, CodigoPapelVinculo = 12,
            DataInicio = new DateOnly(2023, 1, 1), DataFim = new DateOnly(2023, 12, 31), Responsavel = 0
        });
        db.PessoaVinculo.Add(new PessoaVinculo
        {
            IdPessoa = 2, IdCondominio = 1, CodigoPapelVinculo = 17,
            DataInicio = new DateOnly(2024, 1, 1), Responsavel = 0
        });
        await db.SaveChangesAsync();

        var codigosGestor = new uint[] { 10, 11, 12, 13 };
        var lista = await svc.ListarAsync(1, 20, null, "PF", null, "condominio", codigosGestor, true);
        Assert.Single(lista.Items);
        Assert.Equal(1u, lista.Items[0].IdPessoa);
        Assert.Equal(10u, lista.Items[0].CodigoPapelVinculo);

        var todas = await svc.ListarAsync(1, 20, null, "PF", null, "condominio", codigosGestor, null);
        Assert.Equal(2, todas.Items.Count);
        Assert.All(todas.Items, i => Assert.Equal(1u, i.IdPessoa));
        Assert.Contains(todas.Items, i => i.CodigoPapelVinculo == 10);
        Assert.Contains(todas.Items, i => i.CodigoPapelVinculo == 12);
    }

    private static async Task<AppDbContext> CriarDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var tenant = new TenantMutavel(1);
        var db = new AppDbContext(options, tenant);
        db.Condominio.Add(new Condominio { IdCondominio = 1, Nome = "A" });
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