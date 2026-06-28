using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/municipio")]
[Authorize]
public class MunicipioController : ControllerBase
{
    private readonly MunicipioRepository _repo;

    public MunicipioController(MunicipioRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<Municipio>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{codigoIBGEMunicipio}")]
    public async Task<ActionResult<Municipio>> GetById([FromRoute] uint? codigoIBGEMunicipio, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(codigoIBGEMunicipio, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<Municipio>> Create([FromBody] Municipio entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { codigoIBGEMunicipio = created.CodigoIBGEMunicipio }, created);
    }

    [HttpPut("{codigoIBGEMunicipio}")]
    public async Task<IActionResult> Update([FromRoute] uint? codigoIBGEMunicipio, [FromBody] Municipio entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{codigoIBGEMunicipio}")]
    public async Task<IActionResult> Delete([FromRoute] uint? codigoIBGEMunicipio, CancellationToken ct = default)
        => await _repo.DeleteAsync(codigoIBGEMunicipio, ct) ? NoContent() : NotFound();
}
