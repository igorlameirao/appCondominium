using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/ofertaconcorrencia")]
[Authorize]
public class OfertaConcorrenciaController : ControllerBase
{
    private readonly OfertaConcorrenciaRepository _repo;

    public OfertaConcorrenciaController(OfertaConcorrenciaRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<OfertaConcorrencia>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idOfertaConcorrencia}")]
    public async Task<ActionResult<OfertaConcorrencia>> GetById([FromRoute] uint? idOfertaConcorrencia, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idOfertaConcorrencia, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<OfertaConcorrencia>> Create([FromBody] OfertaConcorrencia entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idOfertaConcorrencia = created.IdOfertaConcorrencia }, created);
    }

    [HttpPut("{idOfertaConcorrencia}")]
    public async Task<IActionResult> Update([FromRoute] uint? idOfertaConcorrencia, [FromBody] OfertaConcorrencia entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idOfertaConcorrencia}")]
    public async Task<IActionResult> Delete([FromRoute] uint? idOfertaConcorrencia, CancellationToken ct = default)
        => await _repo.DeleteAsync(idOfertaConcorrencia, ct) ? NoContent() : NotFound();
}
