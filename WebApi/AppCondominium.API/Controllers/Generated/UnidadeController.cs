using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/unidade")]
[Authorize]
public class UnidadeController : ControllerBase
{
    private readonly UnidadeRepository _repo;

    public UnidadeController(UnidadeRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<Unidade>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idUnidade}")]
    public async Task<ActionResult<Unidade>> GetById([FromRoute] uint? idUnidade, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idUnidade, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<Unidade>> Create([FromBody] Unidade entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idUnidade = created.IdUnidade }, created);
    }

    [HttpPut("{idUnidade}")]
    public async Task<IActionResult> Update([FromRoute] uint? idUnidade, [FromBody] Unidade entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idUnidade}")]
    public async Task<IActionResult> Delete([FromRoute] uint? idUnidade, CancellationToken ct = default)
        => await _repo.DeleteAsync(idUnidade, ct) ? NoContent() : NotFound();
}
