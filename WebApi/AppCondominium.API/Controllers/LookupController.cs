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
        var c = await _db.Condominio.IgnoreQueryFilters().AsNoTracking()
            .Where(x => x.IdCondominio == idCondominio)
            .Select(x => new { x.IdCondominio, x.Nome })
            .FirstOrDefaultAsync(ct);
        return c == null ? NotFound() : Ok(c);
    }

    /// <summary>RT-Gerais 13 — resolve o condomínio pelo domínio do site (campo Dominio).</summary>
    [AllowAnonymous]
    [HttpGet("condominio-por-dominio")]
    public async Task<ActionResult<object>> CondominioPorDominio([FromQuery] string? host, CancellationToken ct)
    {
        var h = NormalizarHost(host);
        if (string.IsNullOrEmpty(h))
            h = NormalizarHost(Request.Host.Host);
        if (string.IsNullOrEmpty(h))
            return NotFound();

        // Condomínio é tenant global: sem IgnoreQueryFilters o filtro IdCondominio == 0 oculta todos os registros.
        var dominios = await _db.Condominio.IgnoreQueryFilters().AsNoTracking()
            .Where(x => x.Dominio != null && (x.Ativo == null || x.Ativo != 0))
            .Select(x => new { x.IdCondominio, x.Nome, x.Dominio })
            .ToListAsync(ct);

        var c = dominios
            .Where(x => HostCorrespondeDominio(h, x.Dominio))
            .OrderByDescending(x => NormalizarHost(x.Dominio).Length)
            .FirstOrDefault();
        return c == null ? NotFound() : Ok(new { c.IdCondominio, c.Nome });
    }

    private static bool HostCorrespondeDominio(string host, string? dominio)
    {
        var h = NormalizarHost(host);
        var d = NormalizarHost(dominio);
        if (string.IsNullOrEmpty(h) || string.IsNullOrEmpty(d))
            return false;
        if (h == d)
            return true;
        // Ex.: cadastro "sistema.local" e acesso "sistema.local.127.0.0.1" (hosts locais).
        return h.StartsWith(d + ".", StringComparison.Ordinal);
    }

    private static string NormalizarHost(string? host)
    {
        if (string.IsNullOrWhiteSpace(host))
            return "";
        var h = host.Trim().ToLowerInvariant();
        if (h.StartsWith("http://", StringComparison.Ordinal))
            h = h[7..];
        else if (h.StartsWith("https://", StringComparison.Ordinal))
            h = h[8..];
        var path = h.IndexOf('/');
        if (path >= 0)
            h = h[..path];
        var colon = h.IndexOf(':');
        if (colon > 0)
            h = h[..colon];
        if (h.StartsWith("www."))
            h = h[4..];
        return h;
    }
}
