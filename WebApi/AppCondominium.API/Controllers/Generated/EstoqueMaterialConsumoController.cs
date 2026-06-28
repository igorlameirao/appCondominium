using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/estoquematerialconsumo")]
[Authorize]
public class EstoqueMaterialConsumoController : ControllerBase
{
    private readonly EstoqueMaterialConsumoRepository _repo;

    public EstoqueMaterialConsumoController(EstoqueMaterialConsumoRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<EstoqueMaterialConsumo>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idEstoqueMaterialConsumo}")]
    public async Task<ActionResult<EstoqueMaterialConsumo>> GetById([FromRoute] uint? idEstoqueMaterialConsumo, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idEstoqueMaterialConsumo, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<EstoqueMaterialConsumo>> Create([FromBody] EstoqueMaterialConsumo entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idEstoqueMaterialConsumo = created.IdEstoqueMaterialConsumo }, created);
    }

    [HttpPut("{idEstoqueMaterialConsumo}")]
    public async Task<IActionResult> Update([FromRoute] uint? idEstoqueMaterialConsumo, [FromBody] EstoqueMaterialConsumo entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idEstoqueMaterialConsumo}")]
    public async Task<IActionResult> Delete([FromRoute] uint? idEstoqueMaterialConsumo, CancellationToken ct = default)
        => await _repo.DeleteAsync(idEstoqueMaterialConsumo, ct) ? NoContent() : NotFound();
}
