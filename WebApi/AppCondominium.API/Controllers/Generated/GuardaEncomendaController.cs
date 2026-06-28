using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/guardaencomenda")]
[Authorize]
public class GuardaEncomendaController : ControllerBase
{
    private readonly GuardaEncomendaRepository _repo;

    public GuardaEncomendaController(GuardaEncomendaRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<GuardaEncomenda>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idGuardaEncomenda}")]
    public async Task<ActionResult<GuardaEncomenda>> GetById([FromRoute] ulong? idGuardaEncomenda, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idGuardaEncomenda, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<GuardaEncomenda>> Create([FromBody] GuardaEncomenda entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idGuardaEncomenda = created.IdGuardaEncomenda }, created);
    }

    [HttpPut("{idGuardaEncomenda}")]
    public async Task<IActionResult> Update([FromRoute] ulong? idGuardaEncomenda, [FromBody] GuardaEncomenda entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idGuardaEncomenda}")]
    public async Task<IActionResult> Delete([FromRoute] ulong? idGuardaEncomenda, CancellationToken ct = default)
        => await _repo.DeleteAsync(idGuardaEncomenda, ct) ? NoContent() : NotFound();
}
