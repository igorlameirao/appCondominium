using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/tipomaterial")]
[Authorize]
public class TipoMaterialController : ControllerBase
{
    private readonly TipoMaterialRepository _repo;

    public TipoMaterialController(TipoMaterialRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<TipoMaterial>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idTipoMaterial}")]
    public async Task<ActionResult<TipoMaterial>> GetById([FromRoute] uint? idTipoMaterial, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idTipoMaterial, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<TipoMaterial>> Create([FromBody] TipoMaterial entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idTipoMaterial = created.IdTipoMaterial }, created);
    }

    [HttpPut("{idTipoMaterial}")]
    public async Task<IActionResult> Update([FromRoute] uint? idTipoMaterial, [FromBody] TipoMaterial entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idTipoMaterial}")]
    public async Task<IActionResult> Delete([FromRoute] uint? idTipoMaterial, CancellationToken ct = default)
        => await _repo.DeleteAsync(idTipoMaterial, ct) ? NoContent() : NotFound();
}
