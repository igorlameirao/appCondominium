using AppCondominium.Application.DTOs;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.Infrastructure.Services;

public class PessoaEnderecoService : IPessoaEnderecoService
{
    private const byte Principal = 0;
    private const byte Secundario = 1;
    private const byte Inativo = 2;

    private readonly AppDbContext _db;

    public PessoaEnderecoService(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<PessoaEnderecoItemDto>> ListarPorPessoaAsync(uint idPessoa, CancellationToken ct = default)
    {
        await GarantirPessoaNoTenantAsync(idPessoa, ct);

        return await (
            from pe in VinculosEndereco(idPessoa).AsNoTracking()
            join e in _db.Set<Endereco>().AsNoTracking() on pe.IdEndereco equals e.IdEndereco
            orderby pe.TipoEndereco, e.Logradouro
            select new PessoaEnderecoItemDto(
                pe.IdPessoa, pe.IdEndereco, pe.NumeroEndereco, pe.ComplementoEndereco, pe.TipoEndereco,
                e.CEP, e.Logradouro, e.IdBairro)
        ).ToListAsync(ct);
    }

    public async Task<PessoaEnderecoItemDto> GravarAsync(uint idPessoa, PessoaEnderecoUpsertRequest request, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        await GarantirPessoaNoTenantAsync(idPessoa, ct);

        if (request.TipoEndereco is not (Principal or Secundario or Inativo))
            throw new InvalidOperationException("Tipo de endereço inválido.");

        var vinculo = request.IdEndereco is uint idEnd
            ? await VinculosEndereco(idPessoa).FirstOrDefaultAsync(pe => pe.IdEndereco == idEnd, ct)
            : null;

        uint idEndereco;

        if (vinculo is not null)
        {
            idEndereco = vinculo.IdEndereco;
            await AtualizarEnderecoBaseAsync(idEndereco, request, ct);
            vinculo.NumeroEndereco = request.NumeroEndereco;
            vinculo.ComplementoEndereco = request.ComplementoEndereco?.Trim();
        }
        else if (request.IdEndereco is uint idExistente)
        {
            if (!await _db.Set<Endereco>().AnyAsync(e => e.IdEndereco == idExistente, ct))
                throw new InvalidOperationException("Endereço não encontrado.");
            idEndereco = idExistente;
            _db.PessoaEndereco.Add(new PessoaEndereco
            {
                IdPessoa = idPessoa,
                IdEndereco = idEndereco,
                NumeroEndereco = request.NumeroEndereco,
                ComplementoEndereco = request.ComplementoEndereco?.Trim(),
                TipoEndereco = request.TipoEndereco
            });
        }
        else
        {
            if (string.IsNullOrWhiteSpace(request.Logradouro) || request.IdBairro is null)
                throw new InvalidOperationException("Logradouro e bairro são obrigatórios para novo endereço.");
            var end = new Endereco
            {
                CEP = request.CEP?.Trim(),
                Logradouro = request.Logradouro.Trim(),
                IdBairro = request.IdBairro
            };
            _db.Set<Endereco>().Add(end);
            await _db.SaveChangesAsync(ct);
            idEndereco = end.IdEndereco ?? throw new InvalidOperationException("Falha ao gerar IdEndereco.");
            _db.PessoaEndereco.Add(new PessoaEndereco
            {
                IdPessoa = idPessoa,
                IdEndereco = idEndereco,
                NumeroEndereco = request.NumeroEndereco,
                ComplementoEndereco = request.ComplementoEndereco?.Trim(),
                TipoEndereco = request.TipoEndereco
            });
        }

        await _db.SaveChangesAsync(ct);
        await AplicarRegrasTipoAsync(idPessoa, idEndereco, request.TipoEndereco, vinculo?.TipoEndereco, ct);
        await _db.SaveChangesAsync(ct);

        return (await ListarPorPessoaAsync(idPessoa, ct)).First(i => i.IdEndereco == idEndereco);
    }

    public async Task RemoverAsync(uint idPessoa, uint idEndereco, CancellationToken ct = default)
    {
        await GarantirPessoaNoTenantAsync(idPessoa, ct);
        var pe = await VinculosEndereco(idPessoa).FirstOrDefaultAsync(x => x.IdEndereco == idEndereco, ct)
            ?? throw new InvalidOperationException("Vínculo de endereço não encontrado.");

        if (pe.TipoEndereco == Principal)
        {
            var outros = await VinculosEndereco(idPessoa).AnyAsync(
                x => x.IdEndereco != idEndereco && x.TipoEndereco != Inativo, ct);
            if (!outros)
                throw new InvalidOperationException("Cadastre outro endereço principal antes de Inativar ou tornar esse endereço Secundário.");
        }

        _db.PessoaEndereco.Remove(pe);
        await _db.SaveChangesAsync(ct);
    }

    private async Task AtualizarEnderecoBaseAsync(uint idEndereco, PessoaEnderecoUpsertRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Logradouro) && request.IdBairro is null && string.IsNullOrWhiteSpace(request.CEP))
            return;
        var end = await _db.Set<Endereco>().FirstOrDefaultAsync(e => e.IdEndereco == idEndereco, ct)
            ?? throw new InvalidOperationException("Endereço não encontrado.");
        if (!string.IsNullOrWhiteSpace(request.CEP)) end.CEP = request.CEP;
        if (!string.IsNullOrWhiteSpace(request.Logradouro)) end.Logradouro = request.Logradouro.Trim();
        if (request.IdBairro is uint idBairro) end.IdBairro = idBairro;
    }

    private async Task AplicarRegrasTipoAsync(
        uint idPessoa, uint idEndereco, byte novoTipo, byte? tipoAnterior, CancellationToken ct)
    {
        var todos = await VinculosEndereco(idPessoa).ToListAsync(ct);
        var alvo = todos.FirstOrDefault(x => x.IdEndereco == idEndereco)
            ?? throw new InvalidOperationException("Vínculo de endereço não encontrado.");

        var eraPrincipal = tipoAnterior == Principal || (tipoAnterior is null && alvo.TipoEndereco == Principal);
        if ((novoTipo == Inativo || novoTipo == Secundario) && (alvo.TipoEndereco == Principal || eraPrincipal))
        {
            var outroPrincipal = todos.Any(x => x.IdEndereco != idEndereco && x.TipoEndereco == Principal);
            if (!outroPrincipal)
                throw new InvalidOperationException("Cadastre outro endereço principal antes de Inativar ou tornar esse endereço Secundário.");
        }

        alvo.TipoEndereco = novoTipo;
        if (novoTipo == Principal)
        {
            foreach (var item in todos.Where(x => x.IdEndereco != idEndereco && x.TipoEndereco == Principal))
                item.TipoEndereco = Secundario;
        }
    }

    private IQueryable<PessoaEndereco> VinculosEndereco(uint idPessoa) =>
        _db.PessoaEndereco.IgnoreQueryFilters().Where(pe => pe.IdPessoa == idPessoa);

    private async Task GarantirPessoaNoTenantAsync(uint idPessoa, CancellationToken ct)
    {
        var existe = await _db.Pessoa.IgnoreQueryFilters().AsNoTracking()
            .AnyAsync(p => p.IdPessoa == idPessoa, ct);
        if (!existe)
            throw new InvalidOperationException("Pessoa não encontrada.");

        if (await _db.Pessoa.AsNoTracking().AnyAsync(p => p.IdPessoa == idPessoa, ct))
            return;

        var idCondominio = _db.CurrentTenantId;
        if (idCondominio == 0)
            return;

        var temVinculoOuFornecedor = await _db.PessoaVinculo.AsNoTracking()
                .AnyAsync(v => v.IdPessoa == idPessoa && v.IdCondominio == idCondominio, ct)
            || await _db.Fornecedor.AsNoTracking()
                .AnyAsync(f => f.IdPessoa == idPessoa && f.IdCondominio == idCondominio, ct);
        if (!temVinculoOuFornecedor)
            return;

        throw new InvalidOperationException("Pessoa não encontrada no condomínio ativo.");
    }
}