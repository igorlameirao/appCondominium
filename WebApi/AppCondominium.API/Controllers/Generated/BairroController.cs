using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/bairro")]
[Authorize]
public class BairroController : ControllerBase
{
    private readonly BairroRepository _repo;

    public BairroController(BairroRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<Bairro>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idBairro}")]
    public async Task<ActionResult<Bairro>> GetById([FromRoute] uint? idBairro, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idBairro, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<Bairro>> Create([FromBody] Bairro entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idBairro = created.IdBairro }, created);
    }

    [HttpPut("{idBairro}")]
    public async Task<IActionResult> Update([FromRoute] uint? idBairro, [FromBody] Bairro entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idBairro}")]
    public async Task<IActionResult> Delete([FromRoute] uint? idBairro, CancellationToken ct = default)
        => await _repo.DeleteAsync(idBairro, ct) ? NoContent() : NotFound();
}
