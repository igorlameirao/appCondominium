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

    public LookupController(AppDbContext db) => _db = db;

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

    /// <summary>Configuração do condomínio (RT-Gerais 12/13) — público para tela de login.</summary>
    [AllowAnonymous]
    [HttpGet("configuracao-por-condominio/{idCondominio:int}")]
    public async Task<ActionResult<Domain.Entities.ConfiguracaoCondominio>> ConfiguracaoPorCondominio(uint idCondominio, CancellationToken ct)
    {
        var item = await _db.ConfiguracaoCondominio.AsNoTracking()
            .FirstOrDefaultAsync(c => c.IdCondominio == idCondominio, ct);
        return item == null ? NotFound() : Ok(item);
    }

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
