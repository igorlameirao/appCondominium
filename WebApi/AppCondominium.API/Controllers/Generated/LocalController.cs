using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/local")]
[Authorize]
public class LocalController : ControllerBase
{
    private readonly LocalRepository _repo;

    public LocalController(LocalRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<Local>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idLocal}")]
    public async Task<ActionResult<Local>> GetById([FromRoute] uint? idLocal, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idLocal, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<Local>> Create([FromBody] Local entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idLocal = created.IdLocal }, created);
    }

    [HttpPut("{idLocal}")]
    public async Task<IActionResult> Update([FromRoute] uint? idLocal, [FromBody] Local entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idLocal}")]
    public async Task<IActionResult> Delete([FromRoute] uint? idLocal, CancellationToken ct = default)
        => await _repo.DeleteAsync(idLocal, ct) ? NoContent() : NotFound();
}
