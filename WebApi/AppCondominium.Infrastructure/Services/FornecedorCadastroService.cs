using AppCondominium.Application.DTOs;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Domain.Validators;
using AppCondominium.Domain.Vinculos;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.Infrastructure.Services;

public class FornecedorCadastroService : IFornecedorCadastroService
{
  private readonly AppDbContext _db;
  private readonly ICondominioContext _tenant;
  private readonly IPessoaCadastroService _pessoaCadastro;

  public FornecedorCadastroService(
    AppDbContext db,
    ICondominioContext tenant,
    IPessoaCadastroService pessoaCadastro)
  {
    _db = db;
    _tenant = tenant;
    _pessoaCadastro = pessoaCadastro;
  }

  public async Task<FornecedorIntegradoResponse> CadastrarAsync(
    FornecedorIntegradoRequest request, CancellationToken ct = default)
  {
    var idCondominio = _tenant.RequireTenantId();
    return await GravarAsync(null, request, idCondominio, ct);
  }

  public async Task<FornecedorIntegradoRequest?> ObterParaEdicaoAsync(uint idFornecedor, CancellationToken ct = default)
  {
    var idCondominio = _tenant.RequireTenantId();
    var fornecedor = await _db.Fornecedor.AsNoTracking()
      .FirstOrDefaultAsync(f => f.IdFornecedor == idFornecedor && f.IdCondominio == idCondominio, ct);
    if (fornecedor?.IdPessoa is not uint idPessoa) return null;

    var pessoa = await _db.Pessoa.AsNoTracking().FirstOrDefaultAsync(p => p.IdPessoa == idPessoa, ct);
    if (pessoa is null) return null;

    var req = new FornecedorIntegradoRequest
    {
      IdPessoa = idPessoa,
      CPFCNPJ = pessoa.CPFCNPJ,
      Nome = pessoa.Nome,
      Telefone = pessoa.Telefone,
      Ativo = fornecedor.Ativo == 1
    };

    var pf = await _db.Pessoafisica.AsNoTracking().FirstOrDefaultAsync(p => p.IdPessoa == idPessoa, ct);
    if (pf is not null)
    {
      req.DataNascimento = pf.DataNascimento;
      req.Email = pf.Email;
      return req;
    }

    var pj = await _db.PessoaJuridica.AsNoTracking().FirstOrDefaultAsync(p => p.IdPessoa == idPessoa, ct);
    if (pj is null) return null;
    req.NomeFantasia = pj.NomeFantasia;
    req.DataFundacao = pj.DataFundacao;
    req.InscricaoEstadual = pj.InscricaoEstadual;
    req.InscricaoMunicipal = pj.InscricaoMunicipal;
    req.IdResponsavel = pj.IdResponsavel;
    return req;
  }

  public async Task<FornecedorIntegradoResponse> AtualizarAsync(
    uint idFornecedor, FornecedorIntegradoRequest request, CancellationToken ct = default)
  {
    var idCondominio = _tenant.RequireTenantId();
    return await GravarAsync(idFornecedor, request, idCondominio, ct);
  }

  private async Task<FornecedorIntegradoResponse> GravarAsync(
    uint? idFornecedor, FornecedorIntegradoRequest request, uint idCondominio, CancellationToken ct)
  {
    ArgumentNullException.ThrowIfNull(request);
    var doc = DocumentoValidator.NormalizarCpfCnpj(request.CPFCNPJ)
      ?? throw new InvalidOperationException("CPF/CNPJ é obrigatório.");

    var ehPj = doc.Length == 14;
    var pessoaJaExiste = await _db.Pessoa.IgnoreQueryFilters().AnyAsync(p => p.CPFCNPJ == doc, ct);
    var modoPessoa = pessoaJaExiste && idFornecedor is null
        ? PessoaCadastroModo.ReutilizacaoPessoaExistente
        : PessoaCadastroModo.Completo;
    uint? idPessoaExistente = null;
    if (idFornecedor is uint idExist)
    {
      var atual = await _db.Fornecedor.FirstOrDefaultAsync(f => f.IdFornecedor == idExist, ct)
        ?? throw new InvalidOperationException("Fornecedor não encontrado.");
      if (atual.IdCondominio != idCondominio)
        throw new InvalidOperationException("Fornecedor pertence a outro condomínio.");
      idPessoaExistente = atual.IdPessoa;
    }

    uint idPessoa;
    if (ehPj)
    {
      var pj = await _pessoaCadastro.CriarOuAtualizarPessoaJuridicaAsync(new PessoaJuridicaIntegradaRequest
      {
        CPFCNPJ = request.CPFCNPJ,
        Nome = request.Nome,
        Telefone = request.Telefone,
        NomeFantasia = request.NomeFantasia,
        DataFundacao = request.DataFundacao,
        InscricaoEstadual = request.InscricaoEstadual,
        InscricaoMunicipal = request.InscricaoMunicipal,
        IdResponsavel = request.IdResponsavel
      }, idPessoaExistente, ct, modoPessoa);
      idPessoa = pj.IdPessoa;
    }
    else
    {
      if (request.DataNascimento is null)
        throw new InvalidOperationException("Data de nascimento é obrigatória para fornecedor PF.");
      var pf = await _pessoaCadastro.CriarOuAtualizarPessoaFisicaAsync(new PessoaFisicaIntegradaRequest
      {
        CPFCNPJ = request.CPFCNPJ,
        Nome = request.Nome,
        Telefone = request.Telefone,
        DataNascimento = request.DataNascimento,
        Email = request.Email
      }, idPessoaExistente, ct, modoPessoa);
      idPessoa = pf.IdPessoa;
    }

    Fornecedor fornecedor;
    if (idFornecedor is uint idAtual)
    {
      fornecedor = await _db.Fornecedor.FirstAsync(f => f.IdFornecedor == idAtual, ct);
      if (fornecedor.IdPessoa != idPessoa)
        throw new InvalidOperationException("Não é permitido trocar a pessoa de um fornecedor existente.");
      fornecedor.Ativo = (byte)(request.Ativo ? 1 : 0);
    }
    else
    {
      var duplicado = await _db.Fornecedor.IgnoreQueryFilters()
        .AnyAsync(f => f.IdPessoa == idPessoa && f.IdCondominio == idCondominio, ct);
      if (duplicado)
        throw new InvalidOperationException("Esta pessoa já está cadastrada como fornecedora neste condomínio.");

      fornecedor = new Fornecedor
      {
        IdPessoa = idPessoa,
        IdCondominio = idCondominio,
        Ativo = (byte)(request.Ativo ? 1 : 0)
      };
      _db.Fornecedor.Add(fornecedor);
    }

    await _db.SaveChangesAsync(ct);

    uint? idVinculo = null;
    if (request.CriarPapelVinculo)
    {
      var hoje = PessoaVinculoAtivo.HojeUtc();
      var existePapel = await _db.PessoaVinculo.IgnoreQueryFilters()
        .AnyAsync(v => v.IdPessoa == idPessoa && v.IdCondominio == idCondominio
          && v.CodigoPapelVinculo == PapelVinculoCodigos.Fornecedor, ct);
      if (!existePapel)
      {
        var vinculo = new PessoaVinculo
        {
          IdPessoa = idPessoa,
          IdCondominio = idCondominio,
          CodigoPapelVinculo = PapelVinculoCodigos.Fornecedor,
          DataInicio = hoje,
          Responsavel = 0,
          IdPerfil = null
        };
        _db.PessoaVinculo.Add(vinculo);
        await _db.SaveChangesAsync(ct);
        idVinculo = vinculo.IdVinculo;
      }
    }

    return new FornecedorIntegradoResponse
    {
      IdFornecedor = fornecedor.IdFornecedor!.Value,
      IdPessoa = idPessoa,
      IdCondominio = idCondominio,
      EhPessoaJuridica = ehPj,
      IdVinculoFornecedor = idVinculo
    };
  }
}