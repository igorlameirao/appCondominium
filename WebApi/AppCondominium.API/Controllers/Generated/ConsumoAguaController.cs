using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/consumoagua")]
[Authorize]
public class ConsumoAguaController : ControllerBase
{
    private readonly ConsumoAguaRepository _repo;

    public ConsumoAguaController(ConsumoAguaRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<ConsumoAgua>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idConsumo}")]
    public async Task<ActionResult<ConsumoAgua>> GetById([FromRoute] uint? idConsumo, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idConsumo, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<ConsumoAgua>> Create([FromBody] ConsumoAgua entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idConsumo = created.IdConsumo }, created);
    }

    [HttpPut("{idConsumo}")]
    public async Task<IActionResult> Update([FromRoute] uint? idConsumo, [FromBody] ConsumoAgua entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idConsumo}")]
    public async Task<IActionResult> Delete([FromRoute] uint? idConsumo, CancellationToken ct = default)
        => await _repo.DeleteAsync(idConsumo, ct) ? NoContent() : NotFound();
}
