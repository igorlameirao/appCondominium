using AppCondominium.API.Authorization;
using AppCondominium.API.Storage;
using AppCondominium.Application.Storage;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.API.Controllers;

[ApiController]
[Route("api/tipounidade")]
[Authorize]
[PermissionArquivoResource("TIPOUNIDADE")]
public class TipoUnidadeArquivoController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ArquivoAplicacao _arquivos;
    private readonly StorageObjectKeyBuilder _chaves;

    public TipoUnidadeArquivoController(AppDbContext db, ArquivoAplicacao arquivos, StorageObjectKeyBuilder chaves)
    {
        _db = db;
        _arquivos = arquivos;
        _chaves = chaves;
    }

    [HttpGet("{idTipoUnidade:int}/localizacao-unidade")]
    [HttpHead("{idTipoUnidade:int}/localizacao-unidade")]
    public async Task<IActionResult> ObterLocalizacao(uint idTipoUnidade, CancellationToken ct)
    {
        var radical = await RadicalLocalizacaoAsync(idTipoUnidade, ct);
        if (radical == null)
            return NotFound();
        return await _arquivos.LerAsync(radical, HttpMethods.IsHead(Request.Method), ct);
    }

    [HttpPut("{idTipoUnidade:int}/localizacao-unidade")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(StorageMedia.ImagemPlantaMaxBytes + 1024)]
    public async Task<IActionResult> SalvarLocalizacao(uint idTipoUnidade, IFormFile? arquivo, CancellationToken ct)
    {
        var radical = await RadicalLocalizacaoAsync(idTipoUnidade, ct);
        if (radical == null)
            return NotFound();
        return await _arquivos.SalvarAsync(arquivo, radical, StorageMedia.ImagemPlantaMaxBytes, StorageMedia.ImagensTema, ct);
    }

    [HttpDelete("{idTipoUnidade:int}/localizacao-unidade")]
    public async Task<IActionResult> RemoverLocalizacao(uint idTipoUnidade, CancellationToken ct)
    {
        var radical = await RadicalLocalizacaoAsync(idTipoUnidade, ct);
        if (radical == null)
            return NotFound();
        return await _arquivos.ExcluirAsync(radical, ct);
    }

    [HttpGet("{idTipoUnidade:int}/planta-baixa")]
    [HttpHead("{idTipoUnidade:int}/planta-baixa")]
    public async Task<IActionResult> ObterPlantaBaixa(uint idTipoUnidade, CancellationToken ct)
    {
        var radical = await RadicalPlantaBaixaAsync(idTipoUnidade, ct);
        if (radical == null)
            return NotFound();
        return await _arquivos.LerAsync(radical, HttpMethods.IsHead(Request.Method), ct);
    }

    [HttpPut("{idTipoUnidade:int}/planta-baixa")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(StorageMedia.ImagemPlantaMaxBytes + 1024)]
    public async Task<IActionResult> SalvarPlantaBaixa(uint idTipoUnidade, IFormFile? arquivo, CancellationToken ct)
    {
        var radical = await RadicalPlantaBaixaAsync(idTipoUnidade, ct);
        if (radical == null)
            return NotFound();
        return await _arquivos.SalvarAsync(arquivo, radical, StorageMedia.ImagemPlantaMaxBytes, StorageMedia.ImagensTema, ct);
    }

    [HttpDelete("{idTipoUnidade:int}/planta-baixa")]
    public async Task<IActionResult> RemoverPlantaBaixa(uint idTipoUnidade, CancellationToken ct)
    {
        var radical = await RadicalPlantaBaixaAsync(idTipoUnidade, ct);
        if (radical == null)
            return NotFound();
        return await _arquivos.ExcluirAsync(radical, ct);
    }

    private async Task<string?> RadicalLocalizacaoAsync(uint idTipoUnidade, CancellationToken ct) =>
        await RadicalAsync(idTipoUnidade, (idCondominio, id) => _chaves.LocalizacaoUnidade(idCondominio, id), ct);

    private async Task<string?> RadicalPlantaBaixaAsync(uint idTipoUnidade, CancellationToken ct) =>
        await RadicalAsync(idTipoUnidade, (idCondominio, id) => _chaves.PlantaBaixa(idCondominio, id), ct);

    private async Task<string?> RadicalAsync(
        uint idTipoUnidade,
        Func<uint, uint, string> fabricar,
        CancellationToken ct)
    {
        var tipo = await _db.TipoUnidade.AsNoTracking()
            .FirstOrDefaultAsync(t => t.IdTipoUnidade == idTipoUnidade, ct);
        if (tipo?.IdCondominio is not uint idCondominio)
            return null;
        return fabricar(idCondominio, idTipoUnidade);
    }
}
