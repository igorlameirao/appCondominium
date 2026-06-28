using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/hidrometro")]
[Authorize]
public class HidrometroController : ControllerBase
{
    private readonly HidrometroRepository _repo;

    public HidrometroController(HidrometroRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<Hidrometro>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idHidrometro}")]
    public async Task<ActionResult<Hidrometro>> GetById([FromRoute] uint? idHidrometro, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idHidrometro, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<Hidrometro>> Create([FromBody] Hidrometro entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idHidrometro = created.IdHidrometro }, created);
    }

    [HttpPut("{idHidrometro}")]
    public async Task<IActionResult> Update([FromRoute] uint? idHidrometro, [FromBody] Hidrometro entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idHidrometro}")]
    public async Task<IActionResult> Delete([FromRoute] uint? idHidrometro, CancellationToken ct = default)
        => await _repo.DeleteAsync(idHidrometro, ct) ? NoContent() : NotFound();
}
