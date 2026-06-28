using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/despesa")]
[Authorize]
public class DespesaController : ControllerBase
{
    private readonly DespesaRepository _repo;

    public DespesaController(DespesaRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<Despesa>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idDespesa}")]
    public async Task<ActionResult<Despesa>> GetById([FromRoute] ulong? idDespesa, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idDespesa, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<Despesa>> Create([FromBody] Despesa entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idDespesa = created.IdDespesa }, created);
    }

    [HttpPut("{idDespesa}")]
    public async Task<IActionResult> Update([FromRoute] ulong? idDespesa, [FromBody] Despesa entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idDespesa}")]
    public async Task<IActionResult> Delete([FromRoute] ulong? idDespesa, CancellationToken ct = default)
        => await _repo.DeleteAsync(idDespesa, ct) ? NoContent() : NotFound();
}
