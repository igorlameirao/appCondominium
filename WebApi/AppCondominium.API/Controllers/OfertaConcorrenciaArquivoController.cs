using AppCondominium.API.Authorization;
using AppCondominium.API.Storage;
using AppCondominium.Application.Storage;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.API.Controllers;

[ApiController]
[Route("api/ofertaconcorrencia")]
[Authorize]
[PermissionResource("OFERTACONCORRENCIA")]
public class OfertaConcorrenciaArquivoController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ArquivoAplicacao _arquivos;
    private readonly StorageObjectKeyBuilder _chaves;

    public OfertaConcorrenciaArquivoController(AppDbContext db, ArquivoAplicacao arquivos, StorageObjectKeyBuilder chaves)
    {
        _db = db;
        _arquivos = arquivos;
        _chaves = chaves;
    }

    [HttpGet("{idOferta:int}/documento-comprobatorio")]
    [HttpHead("{idOferta:int}/documento-comprobatorio")]
    public async Task<IActionResult> Obter(uint idOferta, CancellationToken ct)
    {
        var radical = await RadicalAsync(idOferta, ct);
        if (radical == null)
            return NotFound();
        return await _arquivos.LerAsync(radical, HttpMethods.IsHead(Request.Method), ct);
    }

    [HttpPut("{idOferta:int}/documento-comprobatorio")]
    [RequestSizeLimit(StorageMedia.DocumentoMaxBytes + 1024)]
    public async Task<IActionResult> Salvar(uint idOferta, IFormFile? arquivo, CancellationToken ct)
    {
        var radical = await RadicalAsync(idOferta, ct);
        if (radical == null)
            return NotFound();
        return await _arquivos.SalvarAsync(arquivo, radical, StorageMedia.DocumentoMaxBytes, StorageMedia.Documentos, ct);
    }

    [HttpDelete("{idOferta:int}/documento-comprobatorio")]
    public async Task<IActionResult> Remover(uint idOferta, CancellationToken ct)
    {
        var radical = await RadicalAsync(idOferta, ct);
        if (radical == null)
            return NotFound();
        return await _arquivos.ExcluirAsync(radical, ct);
    }

    private async Task<string?> RadicalAsync(uint idOferta, CancellationToken ct)
    {
        var oferta = await _db.OfertaConcorrencia.AsNoTracking()
            .FirstOrDefaultAsync(o => o.IdOfertaConcorrencia == idOferta, ct);
        if (oferta?.IdCondominio is not uint idCondominio)
            return null;
        return _chaves.DocumentoComprobatorio(idCondominio, idOferta);
    }
}
