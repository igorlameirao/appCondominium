using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/tipomaterialcondominio")]
[Authorize]
public class TipoMaterialCondominioController : ControllerBase
{
    private readonly TipoMaterialCondominioRepository _repo;

    public TipoMaterialCondominioController(TipoMaterialCondominioRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<TipoMaterialCondominio>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idTipoMaterial}/{idCondominio}")]
    public async Task<ActionResult<TipoMaterialCondominio>> GetById([FromRoute] uint? idTipoMaterial, [FromRoute] uint? idCondominio, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idTipoMaterial, idCondominio, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<TipoMaterialCondominio>> Create([FromBody] TipoMaterialCondominio entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idTipoMaterial = created.IdTipoMaterial, idCondominio = created.IdCondominio }, created);
    }

    [HttpPut("{idTipoMaterial}/{idCondominio}")]
    public async Task<IActionResult> Update([FromRoute] uint? idTipoMaterial, [FromRoute] uint? idCondominio, [FromBody] TipoMaterialCondominio entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idTipoMaterial}/{idCondominio}")]
    public async Task<IActionResult> Delete([FromRoute] uint? idTipoMaterial, [FromRoute] uint? idCondominio, CancellationToken ct = default)
        => await _repo.DeleteAsync(idTipoMaterial, idCondominio, ct) ? NoContent() : NotFound();
}
