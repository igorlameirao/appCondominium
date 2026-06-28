using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/tipounidade")]
[Authorize]
public class TipoUnidadeController : ControllerBase
{
    private readonly TipoUnidadeRepository _repo;

    public TipoUnidadeController(TipoUnidadeRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<TipoUnidade>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idTipoUnidade}")]
    public async Task<ActionResult<TipoUnidade>> GetById([FromRoute] uint? idTipoUnidade, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idTipoUnidade, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<TipoUnidade>> Create([FromBody] TipoUnidade entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idTipoUnidade = created.IdTipoUnidade }, created);
    }

    [HttpPut("{idTipoUnidade}")]
    public async Task<IActionResult> Update([FromRoute] uint? idTipoUnidade, [FromBody] TipoUnidade entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idTipoUnidade}")]
    public async Task<IActionResult> Delete([FromRoute] uint? idTipoUnidade, CancellationToken ct = default)
        => await _repo.DeleteAsync(idTipoUnidade, ct) ? NoContent() : NotFound();
}
