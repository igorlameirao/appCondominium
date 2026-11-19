using AppCondominium.Application.DTOs;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Domain.Validators;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.Infrastructure.Services;

public class PessoaCadastroService : IPessoaCadastroService
{
    private readonly AppDbContext _db;
    private readonly IPessoaFotoPerfilService _fotoPerfil;

    public PessoaCadastroService(AppDbContext db, IPessoaFotoPerfilService fotoPerfil)
    {
        _db = db;
        _fotoPerfil = fotoPerfil;
    }

    public async Task<PessoaFisicaIntegradaResponse> CriarOuAtualizarPessoaFisicaAsync(
        PessoaFisicaIntegradaRequest request, uint? idPessoa, CancellationToken ct = default,
        PessoaCadastroModo modo = PessoaCadastroModo.Completo)
    {
        ArgumentNullException.ThrowIfNull(request);
        var cpf = DocumentoValidator.NormalizarCpfCnpj(request.CPFCNPJ);
        if (string.IsNullOrEmpty(cpf) || cpf.Length != 11)
            throw new InvalidOperationException("CPF inválido.");
        if (string.IsNullOrWhiteSpace(request.Nome))
            throw new InvalidOperationException("Nome é obrigatório.");
        if (request.DataNascimento is null)
            throw new InvalidOperationException("Data de nascimento é obrigatória.");

        Pessoa? pessoa;
        if (idPessoa is uint id)
        {
            pessoa = await _db.Pessoa.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.IdPessoa == id, ct)
                ?? throw new InvalidOperationException("Pessoa não encontrada.");
            var outro = await _db.Pessoa.IgnoreQueryFilters()
                .AnyAsync(p => p.CPFCNPJ == cpf && p.IdPessoa != id, ct);
            if (outro)
                throw new InvalidOperationException("CPF já cadastrado para outra pessoa.");
            pessoa.CPFCNPJ = cpf;
            pessoa.Nome = request.Nome.Trim();
            pessoa.Telefone = request.Telefone?.Trim();
        }
        else
        {
            pessoa = await _db.Pessoa.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.CPFCNPJ == cpf, ct);
            if (pessoa is null)
            {
                pessoa = new Pessoa { CPFCNPJ = cpf, Nome = request.Nome.Trim(), Telefone = request.Telefone?.Trim() };
                _db.Pessoa.Add(pessoa);
                await _db.SaveChangesAsync(ct);
            }
            else if (modo == PessoaCadastroModo.ReutilizacaoPessoaExistente)
            {
                ValidarPfSomenteLeitura(request, pessoa);
                pessoa.Telefone = request.Telefone?.Trim();
            }
            else
            {
                pessoa.Nome = request.Nome.Trim();
                pessoa.Telefone = request.Telefone?.Trim();
            }
        }

        var idFinal = pessoa.IdPessoa!.Value;
        var pf = await _db.Pessoafisica.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.IdPessoa == idFinal, ct);
        if (pf is null)
        {
            pf = new Pessoafisica
            {
                IdPessoa = idFinal,
                DataNascimento = request.DataNascimento,
                Email = request.Email?.Trim().ToLowerInvariant(),
                Senha = request.Senha
            };
            _db.Pessoafisica.Add(pf);
        }
        else if (modo == PessoaCadastroModo.ReutilizacaoPessoaExistente)
        {
            ValidarPfSomenteLeitura(request, pessoa, pf);
        }
        else
        {
            pf.DataNascimento = request.DataNascimento;
            pf.Email = request.Email?.Trim().ToLowerInvariant();
            if (!string.IsNullOrEmpty(request.Senha))
                pf.Senha = request.Senha;
        }

        await _db.SaveChangesAsync(ct);
        await _fotoPerfil.AplicarAsync(
            idFinal,
            request.FotoPerfilBase64,
            request.FotoPerfilContentType,
            request.FotoPerfilRemover == true,
            ct);
        return new PessoaFisicaIntegradaResponse { IdPessoa = idFinal, Dados = request };
    }

    public async Task<PessoaJuridicaIntegradaResponse> CriarOuAtualizarPessoaJuridicaAsync(
        PessoaJuridicaIntegradaRequest request, uint? idPessoa, CancellationToken ct = default,
        PessoaCadastroModo modo = PessoaCadastroModo.Completo)
    {
        ArgumentNullException.ThrowIfNull(request);
        var cnpj = DocumentoValidator.NormalizarCpfCnpj(request.CPFCNPJ);
        if (string.IsNullOrEmpty(cnpj) || cnpj.Length != 14)
            throw new InvalidOperationException("CNPJ inválido.");
        if (string.IsNullOrWhiteSpace(request.Nome))
            throw new InvalidOperationException("Razão social (Nome) é obrigatória.");

        Pessoa? pessoa;
        if (idPessoa is uint id)
        {
            pessoa = await _db.Pessoa.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.IdPessoa == id, ct)
                ?? throw new InvalidOperationException("Pessoa não encontrada.");
            if (await _db.Pessoa.IgnoreQueryFilters().AnyAsync(p => p.CPFCNPJ == cnpj && p.IdPessoa != id, ct))
                throw new InvalidOperationException("CNPJ já cadastrado para outra pessoa.");
            pessoa.CPFCNPJ = cnpj;
            pessoa.Nome = request.Nome.Trim();
            pessoa.Telefone = request.Telefone?.Trim();
        }
        else
        {
            pessoa = await _db.Pessoa.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.CPFCNPJ == cnpj, ct);
            if (pessoa is null)
            {
                pessoa = new Pessoa { CPFCNPJ = cnpj, Nome = request.Nome.Trim(), Telefone = request.Telefone?.Trim() };
                _db.Pessoa.Add(pessoa);
                await _db.SaveChangesAsync(ct);
            }
            else if (modo == PessoaCadastroModo.ReutilizacaoPessoaExistente)
            {
                ValidarPjSomenteLeitura(request, pessoa);
                pessoa.Telefone = request.Telefone?.Trim();
            }
            else
            {
                pessoa.Nome = request.Nome.Trim();
                pessoa.Telefone = request.Telefone?.Trim();
            }
        }

        var idFinal = pessoa.IdPessoa!.Value;
        var pj = await _db.PessoaJuridica.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.IdPessoa == idFinal, ct);
        if (pj is null)
        {
            pj = new PessoaJuridica
            {
                IdPessoa = idFinal,
                NomeFantasia = request.NomeFantasia?.Trim(),
                DataFundacao = request.DataFundacao,
                InscricaoEstadual = request.InscricaoEstadual?.Trim(),
                InscricaoMunicipal = request.InscricaoMunicipal?.Trim(),
                IdResponsavel = request.IdResponsavel
            };
            _db.PessoaJuridica.Add(pj);
        }
        else if (modo == PessoaCadastroModo.ReutilizacaoPessoaExistente)
        {
            ValidarPjSomenteLeitura(request, pessoa, pj);
        }
        else
        {
            pj.NomeFantasia = request.NomeFantasia?.Trim();
            pj.DataFundacao = request.DataFundacao;
            pj.InscricaoEstadual = request.InscricaoEstadual?.Trim();
            pj.InscricaoMunicipal = request.InscricaoMunicipal?.Trim();
            pj.IdResponsavel = request.IdResponsavel;
        }

        await _db.SaveChangesAsync(ct);
        return new PessoaJuridicaIntegradaResponse { IdPessoa = idFinal, Dados = request };
    }

    public async Task<PessoaFisicaIntegradaResponse?> ObterPessoaFisicaIntegradaAsync(uint idPessoa, CancellationToken ct = default)
    {
        if (!await PessoaAcessivelParaCadastroAsync(idPessoa, ct))
            return null;

        var pf = await _db.Pessoafisica.IgnoreQueryFilters().AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdPessoa == idPessoa, ct);
        if (pf is null) return null;
        var pessoa = await _db.Pessoa.IgnoreQueryFilters().AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdPessoa == idPessoa, ct);
        if (pessoa is null) return null;
        return new PessoaFisicaIntegradaResponse
        {
            IdPessoa = idPessoa,
            Dados = new PessoaFisicaIntegradaRequest
            {
                CPFCNPJ = pessoa.CPFCNPJ,
                Nome = pessoa.Nome,
                Telefone = pessoa.Telefone,
                DataNascimento = pf.DataNascimento,
                Email = pf.Email
            }
        };
    }

    public async Task<PessoaJuridicaIntegradaResponse?> ObterPessoaJuridicaIntegradaAsync(uint idPessoa, CancellationToken ct = default)
    {
        if (!await PessoaAcessivelParaCadastroAsync(idPessoa, ct))
            return null;

        var pj = await _db.PessoaJuridica.IgnoreQueryFilters().AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdPessoa == idPessoa, ct);
        if (pj is null) return null;
        var pessoa = await _db.Pessoa.IgnoreQueryFilters().AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdPessoa == idPessoa, ct);
        if (pessoa is null) return null;
        return new PessoaJuridicaIntegradaResponse
        {
            IdPessoa = idPessoa,
            Dados = new PessoaJuridicaIntegradaRequest
            {
                CPFCNPJ = pessoa.CPFCNPJ,
                Nome = pessoa.Nome,
                Telefone = pessoa.Telefone,
                NomeFantasia = pj.NomeFantasia,
                DataFundacao = pj.DataFundacao,
                InscricaoEstadual = pj.InscricaoEstadual,
                InscricaoMunicipal = pj.InscricaoMunicipal,
                IdResponsavel = pj.IdResponsavel
            }
        };
    }

    /// <summary>
    /// Permite leitura global de PF/PJ recém-cadastradas (sem vínculo no condomínio) e de pessoas já visíveis pelo filtro de tenant.
    /// </summary>
    private async Task<bool> PessoaAcessivelParaCadastroAsync(uint idPessoa, CancellationToken ct)
    {
        var existe = await _db.Pessoa.IgnoreQueryFilters().AsNoTracking()
            .AnyAsync(p => p.IdPessoa == idPessoa, ct);
        if (!existe)
            return false;

        if (await _db.Pessoa.AsNoTracking().AnyAsync(p => p.IdPessoa == idPessoa, ct))
            return true;

        var idCondominio = _db.CurrentTenantId;
        if (idCondominio == 0)
            return true;

        var temVinculoOuFornecedor = await _db.PessoaVinculo.AsNoTracking()
                .AnyAsync(v => v.IdPessoa == idPessoa && v.IdCondominio == idCondominio, ct)
            || await _db.Fornecedor.AsNoTracking()
                .AnyAsync(f => f.IdPessoa == idPessoa && f.IdCondominio == idCondominio, ct);
        if (!temVinculoOuFornecedor)
            return true;

        return false;
    }

    private static void ValidarPfSomenteLeitura(PessoaFisicaIntegradaRequest request, Pessoa pessoa, Pessoafisica? pf = null)
    {
        if (!string.Equals(pessoa.Nome.Trim(), request.Nome.Trim(), StringComparison.Ordinal))
            throw new InvalidOperationException("Nome não pode ser alterado ao reutilizar pessoa existente.");
        if (pf is null) return;
        if (pf.DataNascimento != request.DataNascimento)
            throw new InvalidOperationException("Data de nascimento não pode ser alterada ao reutilizar pessoa existente.");
        var emailReq = request.Email?.Trim().ToLowerInvariant();
        var emailAtual = pf.Email?.Trim().ToLowerInvariant();
        if (emailReq is not null && emailAtual is not null && emailReq != emailAtual)
            throw new InvalidOperationException("E-mail não pode ser alterado ao reutilizar pessoa existente.");
        if (!string.IsNullOrEmpty(request.Senha))
            throw new InvalidOperationException("Senha não pode ser alterada neste fluxo.");
    }

    private static void ValidarPjSomenteLeitura(PessoaJuridicaIntegradaRequest request, Pessoa pessoa, PessoaJuridica? pj = null)
    {
        if (!string.Equals(pessoa.Nome.Trim(), request.Nome.Trim(), StringComparison.Ordinal))
            throw new InvalidOperationException("Razão social não pode ser alterada ao reutilizar pessoa existente.");
        if (pj is null) return;
        var fantasiaReq = request.NomeFantasia?.Trim();
        var fantasiaAtual = pj.NomeFantasia?.Trim();
        if (fantasiaReq is not null && fantasiaAtual is not null && fantasiaReq != fantasiaAtual)
            throw new InvalidOperationException("Nome fantasia não pode ser alterado ao reutilizar pessoa existente.");
        if (request.DataFundacao != pj.DataFundacao)
            throw new InvalidOperationException("Data de fundação não pode ser alterada ao reutilizar pessoa existente.");
        if (request.IdResponsavel != pj.IdResponsavel)
            throw new InvalidOperationException("Responsável não pode ser alterado ao reutilizar pessoa existente.");
    }
}