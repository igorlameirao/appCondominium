using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/entradasaidamaterialconsumo")]
[Authorize]
public class EntradaSaidaMaterialConsumoController : ControllerBase
{
    private readonly EntradaSaidaMaterialConsumoRepository _repo;

    public EntradaSaidaMaterialConsumoController(EntradaSaidaMaterialConsumoRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<EntradaSaidaMaterialConsumo>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idEntradaSaidaMaterialConsumo}")]
    public async Task<ActionResult<EntradaSaidaMaterialConsumo>> GetById([FromRoute] ulong? idEntradaSaidaMaterialConsumo, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idEntradaSaidaMaterialConsumo, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<EntradaSaidaMaterialConsumo>> Create([FromBody] EntradaSaidaMaterialConsumo entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idEntradaSaidaMaterialConsumo = created.IdEntradaSaidaMaterialConsumo }, created);
    }

    [HttpPut("{idEntradaSaidaMaterialConsumo}")]
    public async Task<IActionResult> Update([FromRoute] ulong? idEntradaSaidaMaterialConsumo, [FromBody] EntradaSaidaMaterialConsumo entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idEntradaSaidaMaterialConsumo}")]
    public async Task<IActionResult> Delete([FromRoute] ulong? idEntradaSaidaMaterialConsumo, CancellationToken ct = default)
        => await _repo.DeleteAsync(idEntradaSaidaMaterialConsumo, ct) ? NoContent() : NotFound();
}
