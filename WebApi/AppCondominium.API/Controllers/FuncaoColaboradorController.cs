using AppCondominium.API.Authorization;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AppCondominium.API.Controllers;

[ApiController]
[Route("api/funcaocolaborador")]
[Authorize]
[PermissionResource("FUNCAOCOLABORADOR")]
public class FuncaoColaboradorController : ControllerBase
{
    private readonly FuncaoColaboradorRepository _repo;

    public FuncaoColaboradorController(FuncaoColaboradorRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<FuncaoColaborador>>> GetPaged(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
    {
        try { return Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct)); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    [HttpGet("{id:uint}")]
    public async Task<ActionResult<FuncaoColaborador>> GetById(uint id, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(id, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<FuncaoColaborador>> Create([FromBody] FuncaoColaborador entity, CancellationToken ct = default)
    {
        try
        {
            var created = await _repo.AddAsync(entity, ct);
            return CreatedAtAction(nameof(GetById), new { id = created.IdFuncaoColaborador }, created);
        }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    [HttpPut("{id:uint}")]
    public async Task<IActionResult> Update(uint id, [FromBody] FuncaoColaborador entity, CancellationToken ct = default)
    {
        entity.IdFuncaoColaborador = id;
        try { await _repo.UpdateAsync(entity, ct); return NoContent(); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    [HttpDelete("{id:uint}")]
    public async Task<IActionResult> Delete(uint id, CancellationToken ct = default)
        => await _repo.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
