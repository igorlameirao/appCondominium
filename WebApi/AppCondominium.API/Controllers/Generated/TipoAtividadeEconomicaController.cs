using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/tipoatividadeeconomica")]
[Authorize]
public class TipoAtividadeEconomicaController : ControllerBase
{
    private readonly TipoAtividadeEconomicaRepository _repo;

    public TipoAtividadeEconomicaController(TipoAtividadeEconomicaRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<TipoAtividadeEconomica>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{codigoTipoAtividadeEconomica}")]
    public async Task<ActionResult<TipoAtividadeEconomica>> GetById([FromRoute] uint? codigoTipoAtividadeEconomica, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(codigoTipoAtividadeEconomica, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<TipoAtividadeEconomica>> Create([FromBody] TipoAtividadeEconomica entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { codigoTipoAtividadeEconomica = created.CodigoTipoAtividadeEconomica }, created);
    }

    [HttpPut("{codigoTipoAtividadeEconomica}")]
    public async Task<IActionResult> Update([FromRoute] uint? codigoTipoAtividadeEconomica, [FromBody] TipoAtividadeEconomica entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{codigoTipoAtividadeEconomica}")]
    public async Task<IActionResult> Delete([FromRoute] uint? codigoTipoAtividadeEconomica, CancellationToken ct = default)
        => await _repo.DeleteAsync(codigoTipoAtividadeEconomica, ct) ? NoContent() : NotFound();
}
