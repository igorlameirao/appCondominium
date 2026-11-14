using AppCondominium.Application.Storage;
using AppCondominium.Application.Tenancy;
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
            .Select(x => new { x.IdCondominio, x.Nome, x.Dominio })
            .FirstOrDefaultAsync(ct);
        return c == null ? NotFound() : Ok(c);
    }

    /// <summary>RT-Gerais 13 — resolve o condomínio pelo identificador de URL (slug) ou, legado, pelo host.</summary>
    [AllowAnonymous]
    [HttpGet("condominio-por-dominio")]
    public async Task<ActionResult<object>> CondominioPorDominio([FromQuery] string? slug, [FromQuery] string? host, CancellationToken ct)
    {
        var dominios = await ListarCondominiosAtivosAsync(ct);

        if (!string.IsNullOrWhiteSpace(slug))
        {
            var s = CondominioTenantMatcher.NormalizeSlug(slug);
            var porSlug = dominios
                .FirstOrDefault(x => CondominioTenantMatcher.SlugMatches(s, x.Dominio));
            if (porSlug is null)
                return NotFound();
            return Ok(new { porSlug.IdCondominio, porSlug.Nome, identificadorUrl = CondominioTenantMatcher.NormalizeSlug(porSlug.Dominio) });
        }

        var h = CondominioTenantMatcher.NormalizeHost(host);
        if (string.IsNullOrEmpty(h))
            h = CondominioTenantMatcher.NormalizeHost(Request.Host.Host);
        if (string.IsNullOrEmpty(h))
            return NotFound();

        var porHost = dominios
            .Where(x => CondominioTenantMatcher.HostCorrespondeDominio(h, x.Dominio))
            .OrderByDescending(x => CondominioTenantMatcher.NormalizeHost(x.Dominio ?? "").Length)
            .FirstOrDefault();
        return porHost is null
            ? NotFound()
            : Ok(new { porHost.IdCondominio, porHost.Nome, identificadorUrl = CondominioTenantMatcher.NormalizeSlug(porHost.Dominio) });
    }

    private sealed record CondominioLookupRow(uint IdCondominio, string Nome, string? Dominio);

    private async Task<List<CondominioLookupRow>> ListarCondominiosAtivosAsync(CancellationToken ct)
    {
        // Condomínio é tenant global: sem IgnoreQueryFilters o filtro IdCondominio == 0 oculta todos os registros.
        var rows = await _db.Condominio.IgnoreQueryFilters().AsNoTracking()
            .Where(x => x.Dominio != null && x.IdCondominio != null && (x.Ativo == null || x.Ativo != 0))
            .Select(x => new { x.IdCondominio, x.Nome, x.Dominio })
            .ToListAsync(ct);
        return rows
            .Where(x => x.IdCondominio.HasValue)
            .Select(x => new CondominioLookupRow(x.IdCondominio!.Value, x.Nome ?? "", x.Dominio))
            .ToList();
    }
}
