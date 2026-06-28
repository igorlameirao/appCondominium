using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/concorrencia")]
[Authorize]
public class ConcorrenciaController : ControllerBase
{
    private readonly ConcorrenciaRepository _repo;

    public ConcorrenciaController(ConcorrenciaRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<Concorrencia>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idConcorrencia}")]
    public async Task<ActionResult<Concorrencia>> GetById([FromRoute] uint? idConcorrencia, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idConcorrencia, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<Concorrencia>> Create([FromBody] Concorrencia entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idConcorrencia = created.IdConcorrencia }, created);
    }

    [HttpPut("{idConcorrencia}")]
    public async Task<IActionResult> Update([FromRoute] uint? idConcorrencia, [FromBody] Concorrencia entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idConcorrencia}")]
    public async Task<IActionResult> Delete([FromRoute] uint? idConcorrencia, CancellationToken ct = default)
        => await _repo.DeleteAsync(idConcorrencia, ct) ? NoContent() : NotFound();
}
