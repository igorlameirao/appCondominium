using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/pessoacondominio")]
[Authorize]
public class PessoaCondominioController : ControllerBase
{
    private readonly PessoaCondominioRepository _repo;

    public PessoaCondominioController(PessoaCondominioRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<PessoaCondominio>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idPessoa}/{idCondominio}")]
    public async Task<ActionResult<PessoaCondominio>> GetById([FromRoute] uint? idPessoa, [FromRoute] uint? idCondominio, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idPessoa, idCondominio, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<PessoaCondominio>> Create([FromBody] PessoaCondominio entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idPessoa = created.IdPessoa, idCondominio = created.IdCondominio }, created);
    }

    [HttpPut("{idPessoa}/{idCondominio}")]
    public async Task<IActionResult> Update([FromRoute] uint? idPessoa, [FromRoute] uint? idCondominio, [FromBody] PessoaCondominio entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idPessoa}/{idCondominio}")]
    public async Task<IActionResult> Delete([FromRoute] uint? idPessoa, [FromRoute] uint? idCondominio, CancellationToken ct = default)
        => await _repo.DeleteAsync(idPessoa, idCondominio, ct) ? NoContent() : NotFound();
}
