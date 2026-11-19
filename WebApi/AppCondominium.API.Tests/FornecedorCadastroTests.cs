using AppCondominium.Application.DTOs;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Domain.Vinculos;
using AppCondominium.Infrastructure.Persistence;
using AppCondominium.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace AppCondominium.API.Tests;

public class FornecedorCadastroTests
{
  [Fact]
  public async Task Cadastra_fornecedor_pf_em_dois_condominios_e_rejeita_duplicata_no_mesmo_tenant()
  {
    await using var db = await CriarDb();
    var tenant = new TenantMutavel(1);
    var svc = CriarServico(db, tenant);

    var req = new FornecedorIntegradoRequest
    {
      CPFCNPJ = "39053344705",
      Nome = "Fornecedor PF",
      DataNascimento = new DateOnly(1985, 5, 10),
      Ativo = true
    };

    var a = await svc.CadastrarAsync(req);
    Assert.True(a.IdFornecedor > 0);
    Assert.Equal(1u, a.IdCondominio);

    tenant.SetCondominio(2);
    var b = await svc.CadastrarAsync(req);
    Assert.Equal(a.IdPessoa, b.IdPessoa);
    Assert.Equal(2u, b.IdCondominio);
    Assert.NotEqual(a.IdFornecedor, b.IdFornecedor);

    await Assert.ThrowsAsync<InvalidOperationException>(() => svc.CadastrarAsync(req));
  }

  [Fact]
  public async Task Reutilizacao_pessoa_existente_somente_telefone()
  {
    await using var db = await CriarDb();
    var tenant = new TenantMutavel(1);
    var pessoaSvc = new PessoaCadastroService(db, new FotoPerfilNula());
    await pessoaSvc.CriarOuAtualizarPessoaFisicaAsync(new PessoaFisicaIntegradaRequest
    {
      CPFCNPJ = "52998224725",
      Nome = "Fornecedor Original",
      DataNascimento = new DateOnly(1990, 1, 1)
    }, null);

    var fornecedorSvc = CriarServico(db, tenant);
    await fornecedorSvc.CadastrarAsync(new FornecedorIntegradoRequest
    {
      CPFCNPJ = "52998224725",
      Nome = "Fornecedor Original",
      Telefone = "11999990000",
      DataNascimento = new DateOnly(1990, 1, 1)
    });

    tenant.SetCondominio(2);
    await Assert.ThrowsAsync<InvalidOperationException>(() => fornecedorSvc.CadastrarAsync(new FornecedorIntegradoRequest
    {
      CPFCNPJ = "52998224725",
      Nome = "Nome Alterado",
      DataNascimento = new DateOnly(1990, 1, 1)
    }));
  }

  [Fact]
  public async Task Papel_fornecedor_opcional_nao_atribui_IdPerfil()
  {
    await using var db = await CriarDb();
    var tenant = new TenantMutavel(1);
    var svc = CriarServico(db, tenant);

    var res = await svc.CadastrarAsync(new FornecedorIntegradoRequest
    {
      CPFCNPJ = "39053344705",
      Nome = "Fornecedor com papel",
      DataNascimento = new DateOnly(1985, 5, 10),
      CriarPapelVinculo = true
    });

    var vinculo = await db.PessoaVinculo.SingleAsync(v => v.IdPessoa == res.IdPessoa);
    Assert.Equal(PapelVinculoCodigos.Fornecedor, vinculo.CodigoPapelVinculo);
    Assert.Null(vinculo.IdPerfil);
  }

  private static FornecedorCadastroService CriarServico(AppDbContext db, ICondominioContext tenant)
    => new(db, tenant, new PessoaCadastroService(db, new FotoPerfilNula()));

  private static async Task<AppDbContext> CriarDb()
  {
    var options = new DbContextOptionsBuilder<AppDbContext>()
      .UseInMemoryDatabase(Guid.NewGuid().ToString())
      .Options;
    var db = new AppDbContext(options, new TenantMutavel(1));
    db.Condominio.Add(new Condominio { IdCondominio = 1, Nome = "A" });
    db.Condominio.Add(new Condominio { IdCondominio = 2, Nome = "B" });
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