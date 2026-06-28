using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/tipodespesa")]
[Authorize]
public class TipoDespesaController : ControllerBase
{
    private readonly TipoDespesaRepository _repo;

    public TipoDespesaController(TipoDespesaRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<TipoDespesa>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idTipoDespesa}")]
    public async Task<ActionResult<TipoDespesa>> GetById([FromRoute] uint? idTipoDespesa, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idTipoDespesa, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<TipoDespesa>> Create([FromBody] TipoDespesa entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idTipoDespesa = created.IdTipoDespesa }, created);
    }

    [HttpPut("{idTipoDespesa}")]
    public async Task<IActionResult> Update([FromRoute] uint? idTipoDespesa, [FromBody] TipoDespesa entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idTipoDespesa}")]
    public async Task<IActionResult> Delete([FromRoute] uint? idTipoDespesa, CancellationToken ct = default)
        => await _repo.DeleteAsync(idTipoDespesa, ct) ? NoContent() : NotFound();
}
