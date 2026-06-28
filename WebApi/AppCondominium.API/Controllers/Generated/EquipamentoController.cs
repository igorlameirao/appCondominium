using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/equipamento")]
[Authorize]
public class EquipamentoController : ControllerBase
{
    private readonly EquipamentoRepository _repo;

    public EquipamentoController(EquipamentoRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<Equipamento>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idEquipamento}")]
    public async Task<ActionResult<Equipamento>> GetById([FromRoute] uint? idEquipamento, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idEquipamento, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<Equipamento>> Create([FromBody] Equipamento entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idEquipamento = created.IdEquipamento }, created);
    }

    [HttpPut("{idEquipamento}")]
    public async Task<IActionResult> Update([FromRoute] uint? idEquipamento, [FromBody] Equipamento entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idEquipamento}")]
    public async Task<IActionResult> Delete([FromRoute] uint? idEquipamento, CancellationToken ct = default)
        => await _repo.DeleteAsync(idEquipamento, ct) ? NoContent() : NotFound();
}
