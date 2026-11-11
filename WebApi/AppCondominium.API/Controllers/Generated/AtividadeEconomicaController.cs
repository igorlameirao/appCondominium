using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.API.Authorization;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/atividadeeconomica")]
[Authorize]
[PermissionResource("ATIVIDADEECONOMICA")]
public class AtividadeEconomicaController : ControllerBase
{
    private readonly AtividadeEconomicaRepository _repo;

    public AtividadeEconomicaController(AtividadeEconomicaRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<AtividadeEconomica>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{codigoAtividadeEconomica}")]
    public async Task<ActionResult<AtividadeEconomica>> GetById([FromRoute] uint? codigoAtividadeEconomica, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(codigoAtividadeEconomica, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<AtividadeEconomica>> Create([FromBody] AtividadeEconomica entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { codigoAtividadeEconomica = created.CodigoAtividadeEconomica }, created);
    }

    [HttpPut("{codigoAtividadeEconomica}")]
    public async Task<IActionResult> Update([FromRoute] uint? codigoAtividadeEconomica, [FromBody] AtividadeEconomica entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{codigoAtividadeEconomica}")]
    public async Task<IActionResult> Delete([FromRoute] uint? codigoAtividadeEconomica, CancellationToken ct = default)
        => await _repo.DeleteAsync(codigoAtividadeEconomica, ct) ? NoContent() : NotFound();
}
