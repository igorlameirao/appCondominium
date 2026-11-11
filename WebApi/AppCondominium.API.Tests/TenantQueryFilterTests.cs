using AppCondominium.Application.Interfaces;
using Xunit;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.API.Tests;

public class TenantQueryFilterTests
{
    [Fact]
    public async Task Bloco_query_returns_only_active_tenant()
    {
        var tenant = new MutableTenant();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using (var seed = new AppDbContext(options, tenant))
        {
            seed.Bloco.Add(new Bloco { IdBloco = 1, IdCondominio = 1, Descricao = "A" });
            seed.Bloco.Add(new Bloco { IdBloco = 2, IdCondominio = 2, Descricao = "B" });
            await seed.SaveChangesAsync();
        }

        tenant.SetCondominio(1);
        await using var db = new AppDbContext(options, tenant);
        var items = await db.Bloco.Select(b => b.IdBloco).ToListAsync();
        Assert.Equal(new uint?[] { 1 }, items);

        var leaked = await db.Bloco.IgnoreQueryFilters().CountAsync();
        Assert.Equal(2, leaked);
    }

    [Fact]
    public async Task PessoaUnidade_is_limited_to_units_of_the_tenant()
    {
        var tenant = new MutableTenant();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using (var seed = new AppDbContext(options, tenant))
        {
            seed.Unidade.Add(new Unidade { IdUnidade = 10, IdCondominio = 1 });
            seed.Unidade.Add(new Unidade { IdUnidade = 20, IdCondominio = 2 });
            seed.PessoaUnidade.Add(new PessoaUnidade { IdPessoa = 5, IdUnidade = 10 });
            seed.PessoaUnidade.Add(new PessoaUnidade { IdPessoa = 5, IdUnidade = 20 });
            await seed.SaveChangesAsync();
        }

        tenant.SetCondominio(1);
        await using var db = new AppDbContext(options, tenant);
        var links = await db.PessoaUnidade.Select(p => p.IdUnidade).ToListAsync();
        Assert.Equal(new uint?[] { 10 }, links);
    }

    private sealed class MutableTenant : ICondominioContext
    {
        public uint? IdCondominio { get; private set; }
        public void SetCondominio(uint idCondominio) => IdCondominio = idCondominio;
        public void Clear() => IdCondominio = null;
        public uint RequireTenantId() => IdCondominio ?? throw new InvalidOperationException();
    }
}
