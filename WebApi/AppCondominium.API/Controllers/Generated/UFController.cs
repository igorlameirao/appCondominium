using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/uf")]
[Authorize]
public class UFController : ControllerBase
{
    private readonly UFRepository _repo;

    public UFController(UFRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<UF>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{siglaUF}")]
    public async Task<ActionResult<UF>> GetById([FromRoute] string? siglaUF, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(siglaUF, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<UF>> Create([FromBody] UF entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { siglaUF = created.SiglaUF }, created);
    }

    [HttpPut("{siglaUF}")]
    public async Task<IActionResult> Update([FromRoute] string? siglaUF, [FromBody] UF entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{siglaUF}")]
    public async Task<IActionResult> Delete([FromRoute] string? siglaUF, CancellationToken ct = default)
        => await _repo.DeleteAsync(siglaUF, ct) ? NoContent() : NotFound();
}
