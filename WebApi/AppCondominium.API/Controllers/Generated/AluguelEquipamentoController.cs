using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/aluguelequipamento")]
[Authorize]
public class AluguelEquipamentoController : ControllerBase
{
    private readonly AluguelEquipamentoRepository _repo;

    public AluguelEquipamentoController(AluguelEquipamentoRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<AluguelEquipamento>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idAluguelEquipamento}")]
    public async Task<ActionResult<AluguelEquipamento>> GetById([FromRoute] uint? idAluguelEquipamento, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idAluguelEquipamento, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<AluguelEquipamento>> Create([FromBody] AluguelEquipamento entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idAluguelEquipamento = created.IdAluguelEquipamento }, created);
    }

    [HttpPut("{idAluguelEquipamento}")]
    public async Task<IActionResult> Update([FromRoute] uint? idAluguelEquipamento, [FromBody] AluguelEquipamento entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idAluguelEquipamento}")]
    public async Task<IActionResult> Delete([FromRoute] uint? idAluguelEquipamento, CancellationToken ct = default)
        => await _repo.DeleteAsync(idAluguelEquipamento, ct) ? NoContent() : NotFound();
}
