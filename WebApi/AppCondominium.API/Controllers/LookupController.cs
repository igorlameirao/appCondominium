using AppCondominium.Application.Storage;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.API.Controllers;

[ApiController]
[Route("api/lookup")]
[Authorize]
public class LookupController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IArquivoStorage _arquivos;
    private readonly StorageObjectKeyBuilder _chaves;

    public LookupController(AppDbContext db, IArquivoStorage arquivos, StorageObjectKeyBuilder chaves)
    {
        _db = db;
        _arquivos = arquivos;
        _chaves = chaves;
    }

    /// <summary>RN-UF-01 — municípios da UF.</summary>
    [HttpGet("municipios-por-uf/{siglaUF}")]
    public async Task<ActionResult<IEnumerable<object>>> MunicipiosPorUf(string siglaUF, CancellationToken ct)
    {
        var uf = siglaUF.Trim().ToUpperInvariant();
        var items = await _db.Municipio.AsNoTracking()
            .Where(m => m.SiglaUF == uf)
            .OrderBy(m => m.Nome)
            .Select(m => new { m.CodigoIBGEMunicipio, m.Nome, m.SiglaUF })
            .ToListAsync(ct);
        return Ok(items);
    }

    /// <summary>RN-Municipio-01 — bairros do município.</summary>
    [HttpGet("bairros-por-municipio/{codigoIbge:int}")]
    public async Task<ActionResult<IEnumerable<object>>> BairrosPorMunicipio(uint codigoIbge, CancellationToken ct)
    {
        var items = await _db.Bairro.AsNoTracking()
            .Where(b => b.CodigoIBGEMunicipio == codigoIbge)
            .OrderBy(b => b.Nome)
            .Select(b => new { b.IdBairro, b.Nome, b.CodigoIBGEMunicipio })
            .ToListAsync(ct);
        return Ok(items);
    }

    /// <summary>Configuração do condomínio (RT-Gerais 12/13) — público para tela de login. Imagens saem em rotas próprias.</summary>
    [AllowAnonymous]
    [HttpGet("configuracao-por-condominio/{idCondominio:int}")]
    public async Task<ActionResult<ConfiguracaoPublicaDto>> ConfiguracaoPorCondominio(uint idCondominio, CancellationToken ct)
    {
        var item = await _db.ConfiguracaoCondominio.IgnoreQueryFilters().AsNoTracking()
            .FirstOrDefaultAsync(c => c.IdCondominio == idCondominio, ct);
        if (item == null)
            return NotFound();

        var temLogin = await _arquivos.ExisteAsync(_chaves.ImagemLogin(idCondominio), ct);
        var temIcone = await _arquivos.ExisteAsync(_chaves.ImagemIcone(idCondominio), ct);
        return Ok(new ConfiguracaoPublicaDto(item.IdConfiguracao, item.IdCondominio, item.CorPadrao, temLogin, temIcone));
    }

    [AllowAnonymous]
    [HttpGet("condominios/{idCondominio:int}/imagem-login")]
    public async Task<IActionResult> ImagemLogin(uint idCondominio, CancellationToken ct)
    {
        var objeto = await _arquivos.AbrirAsync(_chaves.ImagemLogin(idCondominio), ct);
        return objeto == null ? NotFound() : File(objeto.Conteudo, objeto.ContentType);
    }

    [AllowAnonymous]
    [HttpGet("condominios/{idCondominio:int}/imagem-icone")]
    public async Task<IActionResult> ImagemIcone(uint idCondominio, CancellationToken ct)
    {
        var objeto = await _arquivos.AbrirAsync(_chaves.ImagemIcone(idCondominio), ct);
        return objeto == null ? NotFound() : File(objeto.Conteudo, objeto.ContentType);
    }

    public record ConfiguracaoPublicaDto(
        uint? IdConfiguracao,
        uint? IdCondominio,
        string? CorPadrao,
        bool TemImagemLogin,
        bool TemImagemIcone);

    [AllowAnonymous]
    [HttpGet("condominio-resumo/{idCondominio:int}")]
    public async Task<ActionResult<object>> CondominioResumo(uint idCondominio, CancellationToken ct)
    {
        var c = await _db.Condominio.AsNoTracking()
            .Where(x => x.IdCondominio == idCondominio)
            .Select(x => new { x.IdCondominio, x.Nome })
            .FirstOrDefaultAsync(ct);
        return c == null ? NotFound() : Ok(c);
    }
}
