using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/endereco")]
[Authorize]
public class EnderecoController : ControllerBase
{
    private readonly EnderecoRepository _repo;

    public EnderecoController(EnderecoRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<Endereco>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idEndereco}")]
    public async Task<ActionResult<Endereco>> GetById([FromRoute] uint? idEndereco, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idEndereco, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<Endereco>> Create([FromBody] Endereco entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idEndereco = created.IdEndereco }, created);
    }

    [HttpPut("{idEndereco}")]
    public async Task<IActionResult> Update([FromRoute] uint? idEndereco, [FromBody] Endereco entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idEndereco}")]
    public async Task<IActionResult> Delete([FromRoute] uint? idEndereco, CancellationToken ct = default)
        => await _repo.DeleteAsync(idEndereco, ct) ? NoContent() : NotFound();
}
