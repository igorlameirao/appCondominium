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
    public async Task PessoaVinculo_is_limited_to_active_tenant()
    {
        var tenant = new MutableTenant();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using (var seed = new AppDbContext(options, tenant))
        {
            seed.PessoaVinculo.Add(new PessoaVinculo
            {
                IdVinculo = 1,
                IdPessoa = 5,
                IdCondominio = 1,
                CodigoPapelVinculo = 14,
                DataInicio = new DateOnly(2024, 1, 1),
                Responsavel = 0
            });
            seed.PessoaVinculo.Add(new PessoaVinculo
            {
                IdVinculo = 2,
                IdPessoa = 6,
                IdCondominio = 2,
                CodigoPapelVinculo = 14,
                DataInicio = new DateOnly(2024, 1, 1),
                Responsavel = 0
            });
            await seed.SaveChangesAsync();
        }

        tenant.SetCondominio(1);
        await using var db = new AppDbContext(options, tenant);
        var links = await db.PessoaVinculo.Select(p => p.IdVinculo).ToListAsync();
        Assert.Equal(new uint?[] { 1 }, links);
    }

    private sealed class MutableTenant : ICondominioContext
    {
        public uint? IdCondominio { get; private set; }
        public void SetCondominio(uint idCondominio) => IdCondominio = idCondominio;
        public void Clear() => IdCondominio = null;
        public uint RequireTenantId() => IdCondominio ?? throw new InvalidOperationException();
    }
}
