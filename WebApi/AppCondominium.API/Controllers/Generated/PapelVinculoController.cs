using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.API.Authorization;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/papelvinculo")]
[Authorize]
[PermissionResource("PAPELVINCULO")]
public class PapelVinculoController : ControllerBase
{
    private readonly PapelVinculoRepository _repo;

    public PapelVinculoController(PapelVinculoRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<PapelVinculo>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{codigoPapelVinculo}")]
    public async Task<ActionResult<PapelVinculo>> GetById([FromRoute] uint? codigoPapelVinculo, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(codigoPapelVinculo, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<PapelVinculo>> Create([FromBody] PapelVinculo entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { codigoPapelVinculo = created.CodigoPapelVinculo }, created);
    }

    [HttpPut("{codigoPapelVinculo}")]
    public async Task<IActionResult> Update([FromRoute] uint? codigoPapelVinculo, [FromBody] PapelVinculo entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{codigoPapelVinculo}")]
    public async Task<IActionResult> Delete([FromRoute] uint? codigoPapelVinculo, CancellationToken ct = default)
        => await _repo.DeleteAsync(codigoPapelVinculo, ct) ? NoContent() : NotFound();
}
