using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/material")]
[Authorize]
public class MaterialController : ControllerBase
{
    private readonly MaterialRepository _repo;

    public MaterialController(MaterialRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<Material>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idMaterial}")]
    public async Task<ActionResult<Material>> GetById([FromRoute] uint? idMaterial, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idMaterial, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<Material>> Create([FromBody] Material entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idMaterial = created.IdMaterial }, created);
    }

    [HttpPut("{idMaterial}")]
    public async Task<IActionResult> Update([FromRoute] uint? idMaterial, [FromBody] Material entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idMaterial}")]
    public async Task<IActionResult> Delete([FromRoute] uint? idMaterial, CancellationToken ct = default)
        => await _repo.DeleteAsync(idMaterial, ct) ? NoContent() : NotFound();
}
