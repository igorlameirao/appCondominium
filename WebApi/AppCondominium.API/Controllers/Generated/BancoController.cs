using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/banco")]
[Authorize]
public class BancoController : ControllerBase
{
    private readonly BancoRepository _repo;

    public BancoController(BancoRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<Banco>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{codigoBanco}")]
    public async Task<ActionResult<Banco>> GetById([FromRoute] uint? codigoBanco, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(codigoBanco, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<Banco>> Create([FromBody] Banco entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { codigoBanco = created.CodigoBanco }, created);
    }

    [HttpPut("{codigoBanco}")]
    public async Task<IActionResult> Update([FromRoute] uint? codigoBanco, [FromBody] Banco entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{codigoBanco}")]
    public async Task<IActionResult> Delete([FromRoute] uint? codigoBanco, CancellationToken ct = default)
        => await _repo.DeleteAsync(codigoBanco, ct) ? NoContent() : NotFound();
}
