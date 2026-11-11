using AppCondominium.API.Authorization;
using AppCondominium.API.Storage;
using AppCondominium.Application.Interfaces;
using AppCondominium.Application.Storage;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.API.Controllers;

[ApiController]
[Route("api/pessoaunidade")]
[Authorize]
[PermissionResource("UNIDADE")]
public class PessoaUnidadeArquivoController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICondominioContext _tenant;
    private readonly ArquivoAplicacao _arquivos;
    private readonly StorageObjectKeyBuilder _chaves;

    public PessoaUnidadeArquivoController(
        AppDbContext db,
        ICondominioContext tenant,
        ArquivoAplicacao arquivos,
        StorageObjectKeyBuilder chaves)
    {
        _db = db;
        _tenant = tenant;
        _arquivos = arquivos;
        _chaves = chaves;
    }

    [HttpGet("{idPessoa:int}/{idUnidade:int}/procuracao")]
    [HttpHead("{idPessoa:int}/{idUnidade:int}/procuracao")]
    public async Task<IActionResult> Obter(uint idPessoa, uint idUnidade, CancellationToken ct)
    {
        var radical = await RadicalAsync(idPessoa, idUnidade, ct);
        if (radical == null)
            return NotFound();
        return await _arquivos.LerAsync(radical, HttpMethods.IsHead(Request.Method), ct);
    }

    [HttpPut("{idPessoa:int}/{idUnidade:int}/procuracao")]
    [RequestSizeLimit(StorageMedia.DocumentoMaxBytes + 1024)]
    public async Task<IActionResult> Salvar(uint idPessoa, uint idUnidade, IFormFile? arquivo, CancellationToken ct)
    {
        var radical = await RadicalAsync(idPessoa, idUnidade, ct);
        if (radical == null)
            return NotFound();
        return await _arquivos.SalvarAsync(arquivo, radical, StorageMedia.DocumentoMaxBytes, StorageMedia.Documentos, ct);
    }

    [HttpDelete("{idPessoa:int}/{idUnidade:int}/procuracao")]
    public async Task<IActionResult> Remover(uint idPessoa, uint idUnidade, CancellationToken ct)
    {
        var radical = await RadicalAsync(idPessoa, idUnidade, ct);
        if (radical == null)
            return NotFound();
        return await _arquivos.ExcluirAsync(radical, ct);
    }

    private async Task<string?> RadicalAsync(uint idPessoa, uint idUnidade, CancellationToken ct)
    {
        var vinculo = await _db.PessoaUnidade.AsNoTracking()
            .AnyAsync(p => p.IdPessoa == idPessoa && p.IdUnidade == idUnidade, ct);
        if (!vinculo || _tenant.IdCondominio is not uint idCondominio)
            return null;

        var unidadeDoTenant = await _db.Unidade.AsNoTracking()
            .AnyAsync(u => u.IdUnidade == idUnidade && u.IdCondominio == idCondominio, ct);
        if (!unidadeDoTenant)
            return null;

        return _chaves.Procuracao(idCondominio, idPessoa, idUnidade);
    }
}
