using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/bloco")]
[Authorize]
public class BlocoController : ControllerBase
{
    private readonly BlocoRepository _repo;

    public BlocoController(BlocoRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<Bloco>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idBloco}")]
    public async Task<ActionResult<Bloco>> GetById([FromRoute] uint? idBloco, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idBloco, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<Bloco>> Create([FromBody] Bloco entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idBloco = created.IdBloco }, created);
    }

    [HttpPut("{idBloco}")]
    public async Task<IActionResult> Update([FromRoute] uint? idBloco, [FromBody] Bloco entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idBloco}")]
    public async Task<IActionResult> Delete([FromRoute] uint? idBloco, CancellationToken ct = default)
        => await _repo.DeleteAsync(idBloco, ct) ? NoContent() : NotFound();
}
