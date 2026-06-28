using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/condominio")]
[Authorize]
public class CondominioController : ControllerBase
{
    private readonly CondominioRepository _repo;

    public CondominioController(CondominioRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<Condominio>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idCondominio}")]
    public async Task<ActionResult<Condominio>> GetById([FromRoute] uint? idCondominio, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idCondominio, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<Condominio>> Create([FromBody] Condominio entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idCondominio = created.IdCondominio }, created);
    }

    [HttpPut("{idCondominio}")]
    public async Task<IActionResult> Update([FromRoute] uint? idCondominio, [FromBody] Condominio entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idCondominio}")]
    public async Task<IActionResult> Delete([FromRoute] uint? idCondominio, CancellationToken ct = default)
        => await _repo.DeleteAsync(idCondominio, ct) ? NoContent() : NotFound();
}
