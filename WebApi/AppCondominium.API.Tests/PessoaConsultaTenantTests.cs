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