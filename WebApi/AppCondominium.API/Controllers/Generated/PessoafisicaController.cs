using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/pessoafisica")]
[Authorize]
public class PessoafisicaController : ControllerBase
{
    private readonly PessoafisicaRepository _repo;

    public PessoafisicaController(PessoafisicaRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<Pessoafisica>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idPessoa}")]
    public async Task<ActionResult<Pessoafisica>> GetById([FromRoute] uint? idPessoa, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idPessoa, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<Pessoafisica>> Create([FromBody] Pessoafisica entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idPessoa = created.IdPessoa }, created);
    }

    [HttpPut("{idPessoa}")]
    public async Task<IActionResult> Update([FromRoute] uint? idPessoa, [FromBody] Pessoafisica entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idPessoa}")]
    public async Task<IActionResult> Delete([FromRoute] uint? idPessoa, CancellationToken ct = default)
        => await _repo.DeleteAsync(idPessoa, ct) ? NoContent() : NotFound();
}
