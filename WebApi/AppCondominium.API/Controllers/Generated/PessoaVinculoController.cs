using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.API.Authorization;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/pessoavinculo")]
[Authorize]
[PermissionResource("PESSOAVINCULO")]
public class PessoaVinculoController : ControllerBase
{
    private readonly PessoaVinculoRepository _repo;

    public PessoaVinculoController(PessoaVinculoRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<PessoaVinculo>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idVinculo}")]
    public async Task<ActionResult<PessoaVinculo>> GetById([FromRoute] uint? idVinculo, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idVinculo, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<PessoaVinculo>> Create([FromBody] PessoaVinculo entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idVinculo = created.IdVinculo }, created);
    }

    [HttpPut("{idVinculo}")]
    public async Task<IActionResult> Update([FromRoute] uint? idVinculo, [FromBody] PessoaVinculo entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idVinculo}")]
    public async Task<IActionResult> Delete([FromRoute] uint? idVinculo, CancellationToken ct = default)
        => await _repo.DeleteAsync(idVinculo, ct) ? NoContent() : NotFound();
}
