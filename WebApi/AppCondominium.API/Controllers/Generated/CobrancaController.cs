using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/cobranca")]
[Authorize]
public class CobrancaController : ControllerBase
{
    private readonly CobrancaRepository _repo;

    public CobrancaController(CobrancaRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<Cobranca>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idCobranca}")]
    public async Task<ActionResult<Cobranca>> GetById([FromRoute] ulong? idCobranca, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idCobranca, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<Cobranca>> Create([FromBody] Cobranca entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idCobranca = created.IdCobranca }, created);
    }

    [HttpPut("{idCobranca}")]
    public async Task<IActionResult> Update([FromRoute] ulong? idCobranca, [FromBody] Cobranca entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idCobranca}")]
    public async Task<IActionResult> Delete([FromRoute] ulong? idCobranca, CancellationToken ct = default)
        => await _repo.DeleteAsync(idCobranca, ct) ? NoContent() : NotFound();
}
