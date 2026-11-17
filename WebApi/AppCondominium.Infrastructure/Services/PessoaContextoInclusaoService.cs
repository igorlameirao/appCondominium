using AppCondominium.Application.DTOs;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Domain.Validators;
using AppCondominium.Domain.Vinculos;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.Infrastructure.Services;

public class PessoaContextoInclusaoService : IPessoaContextoInclusaoService
{
    private readonly AppDbContext _db;
    private readonly ICondominioContext _tenant;
    private readonly IPessoaCadastroService _cadastro;
    private readonly IPessoaVinculoService _vinculos;
    private readonly IColaboradorService _colaborador;

    public PessoaContextoInclusaoService(
        AppDbContext db,
        ICondominioContext tenant,
        IPessoaCadastroService cadastro,
        IPessoaVinculoService vinculos,
        IColaboradorService colaborador)
    {
        _db = db;
        _tenant = tenant;
        _cadastro = cadastro;
        _vinculos = vinculos;
        _colaborador = colaborador;
    }

    public async Task<PessoaContextoGravacaoResponse> GravarAsync(
        PessoaContextoGravacaoRequest request, uint? idPessoa, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        var def = PessoaContextoCatalogo.Exigir(request.ContextoId);
        var doc = DocumentoValidator.NormalizarCpfCnpj(request.Cpfcnpj);
        if (string.IsNullOrEmpty(doc))
            throw new InvalidOperationException("Informe o CPF ou CNPJ.");

        var ehCnpj = doc.Length == 14;
        if (def.TipoPessoa == "PF" && ehCnpj)
            throw new InvalidOperationException("Este vínculo aceita somente pessoa física (CPF).");
        if (ehCnpj && !PapelVinculoCodigos.PermitePessoaJuridica(def.CodigosPapel[0]))
            throw new InvalidOperationException("Pessoa jurídica só pode ter os papéis Proprietário, Locatário ou Fornecedor.");

        var existente = await _db.Pessoa.IgnoreQueryFilters().AsNoTracking()
            .FirstOrDefaultAsync(p => p.CPFCNPJ == doc, ct);
        var pessoaNova = idPessoa is null && existente is null;
        ValidarObrigatorios(def, request, pessoaNova, ehCnpj);

        if (!_db.Database.IsRelational())
            return await GravarNucleoAsync(def, request, doc, ehCnpj, idPessoa, existente, pessoaNova, ct);

        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        var resposta = await GravarNucleoAsync(def, request, doc, ehCnpj, idPessoa, existente, pessoaNova, ct);
        await tx.CommitAsync(ct);
        return resposta;
    }

    private async Task<PessoaContextoGravacaoResponse> GravarNucleoAsync(
        PessoaContextoDefinicao def,
        PessoaContextoGravacaoRequest request,
        string doc,
        bool ehCnpj,
        uint? idPessoa,
        Pessoa? existente,
        bool pessoaNova,
        CancellationToken ct)
    {
        uint id;
        if (ehCnpj)
        {
            var resp = await _cadastro.CriarOuAtualizarPessoaJuridicaAsync(new PessoaJuridicaIntegradaRequest
            {
                CPFCNPJ = doc,
                Nome = request.Nome,
                Telefone = request.Telefone,
                NomeFantasia = request.NomeFantasia,
                DataFundacao = request.DataFundacao,
                InscricaoEstadual = request.InscricaoEstadual,
                InscricaoMunicipal = request.InscricaoMunicipal
            }, idPessoa ?? existente?.IdPessoa, ct, pessoaNova ? PessoaCadastroModo.Completo : PessoaCadastroModo.ReutilizacaoPessoaExistente);
            id = resp.IdPessoa;
        }
        else
        {
            var resp = await _cadastro.CriarOuAtualizarPessoaFisicaAsync(new PessoaFisicaIntegradaRequest
            {
                CPFCNPJ = doc,
                Nome = request.Nome,
                Telefone = request.Telefone,
                Email = request.Email,
                DataNascimento = request.DataNascimento
            }, idPessoa ?? existente?.IdPessoa, ct, pessoaNova ? PessoaCadastroModo.Completo : PessoaCadastroModo.ReutilizacaoPessoaExistente);
            id = resp.IdPessoa;
        }

        var codigo = ResolverCodigoPapel(def, request);
        var vinculo = await LocalizarVinculoAbertoAsync(id, def, request, codigo, ct);
        var inclusaoVinculo = vinculo is null;
        vinculo ??= new PessoaVinculo
        {
            IdPessoa = id,
            CodigoPapelVinculo = codigo,
            IdCondominio = _tenant.RequireTenantId()
        };
        vinculo.IdUnidade = def.EscopoPapel == "unidade" ? request.IdUnidade : null;
        vinculo.IdPessoaRelacionada = def.EscopoPapel == "pessoa" ? request.IdPessoaRelacionada : null;
        vinculo.DataInicio = request.DataInicio;
        vinculo.DataFim = request.DataFim;
        vinculo.IdPerfil = request.IdPerfil;
        vinculo.Responsavel = request.Responsavel ?? 0;
        vinculo.Observacao = request.Observacao;
        vinculo.CodigoPapelVinculo = codigo;

        await _vinculos.ValidarAntesGravarAsync(vinculo, inclusaoVinculo, ct);
        if (inclusaoVinculo)
            _db.PessoaVinculo.Add(vinculo);
        await _db.SaveChangesAsync(ct);
        await _vinculos.AplicarAjustesAposGravarAsync(vinculo, ct);

        uint? idColaborador = null;
        if (def.TiposDado.Contains("colaborador"))
        {
            idColaborador = await _colaborador.GravarAsync(
                id, request, ResolverTipoColaborador(def, request, codigo), pessoaNova || inclusaoVinculo, ct);
        }

        if (codigo == PapelVinculoCodigos.Fornecedor)
            await GarantirFornecedorAsync(id, ct);

        return new PessoaContextoGravacaoResponse
        {
            IdPessoa = id,
            Tipo = ehCnpj ? "PJ" : "PF",
            IdVinculo = vinculo.IdVinculo,
            IdColaborador = idColaborador
        };
    }

    private async Task<PessoaVinculo?> LocalizarVinculoAbertoAsync(
        uint idPessoa, PessoaContextoDefinicao def, PessoaContextoGravacaoRequest request, uint codigoPapel, CancellationToken ct)
    {
        var codigo = codigoPapel;
        var tenantId = _tenant.RequireTenantId();
        var query = _db.PessoaVinculo.Where(v =>
            v.IdPessoa == idPessoa
            && v.IdCondominio == tenantId
            && v.CodigoPapelVinculo == codigo
            && v.DataFim == null);
        if (def.EscopoPapel == "unidade")
            query = query.Where(v => v.IdUnidade == request.IdUnidade);
        if (def.EscopoPapel == "pessoa")
            query = query.Where(v => v.IdPessoaRelacionada == request.IdPessoaRelacionada);
        return await query.FirstOrDefaultAsync(ct);
    }

    private async Task GarantirFornecedorAsync(uint idPessoa, CancellationToken ct)
    {
        var tenantId = _tenant.RequireTenantId();
        var existe = await _db.Fornecedor.IgnoreQueryFilters()
            .AnyAsync(f => f.IdPessoa == idPessoa && f.IdCondominio == tenantId, ct);
        if (existe) return;
        _db.Fornecedor.Add(new Fornecedor { IdPessoa = idPessoa, IdCondominio = tenantId, Ativo = 1 });
        await _db.SaveChangesAsync(ct);
    }

    private static uint ResolverCodigoPapel(PessoaContextoDefinicao def, PessoaContextoGravacaoRequest request)
    {
        if (request.CodigoPapelVinculo is uint escolhido && def.CodigosPapel.Contains(escolhido))
            return escolhido;
        if (def.CodigosPapel.Length == 1)
            return def.CodigosPapel[0];
        if (request.TipoColaborador == TipoColaboradorCodigos.Terceirizado)
            return PapelVinculoCodigos.Terceirizado;
        return PapelVinculoCodigos.Funcionario;
    }

    private static byte ResolverTipoColaborador(PessoaContextoDefinicao def, PessoaContextoGravacaoRequest request, uint codigoPapel)
    {
        if (request.TipoColaborador is byte t && (t == TipoColaboradorCodigos.Funcionario || t == TipoColaboradorCodigos.Terceirizado))
            return t;
        if (def.TipoColaborador is byte fixo)
            return fixo;
        return codigoPapel == PapelVinculoCodigos.Terceirizado
            ? TipoColaboradorCodigos.Terceirizado
            : TipoColaboradorCodigos.Funcionario;
    }

    private static void ValidarObrigatorios(PessoaContextoDefinicao def, PessoaContextoGravacaoRequest request, bool pessoaNova, bool ehCnpj)
    {
        if (pessoaNova)
        {
            if (def.PessoaNova.Contains("nome") && string.IsNullOrWhiteSpace(request.Nome))
                throw new InvalidOperationException("Nome é obrigatório.");
            if (!ehCnpj && def.PessoaNova.Contains("dataNascimento") && request.DataNascimento is null)
                throw new InvalidOperationException("Data de nascimento é obrigatória.");
        }

        if (def.Vinculo.Contains("idUnidade") && request.IdUnidade is null or 0)
            throw new InvalidOperationException("Unidade é obrigatória para este vínculo.");
        if (def.Vinculo.Contains("idPessoaRelacionada") && request.IdPessoaRelacionada is null or 0)
            throw new InvalidOperationException("Pessoa relacionada é obrigatória para este vínculo.");
        if (def.Vinculo.Contains("dataInicio") && request.DataInicio is null)
            throw new InvalidOperationException("Data de início é obrigatória.");

        if (def.Colaborador.Contains("dataAdmissao") && request.DataAdmissao is null)
            throw new InvalidOperationException("Data de admissão é obrigatória.");
        if (def.Colaborador.Contains("ctps") && string.IsNullOrWhiteSpace(request.Ctps))
            throw new InvalidOperationException("CTPS é obrigatória.");
        if (def.Colaborador.Contains("idFuncaoColaborador") && request.IdFuncaoColaborador is null or 0)
            throw new InvalidOperationException("Função de colaborador é obrigatória.");
    }
}
