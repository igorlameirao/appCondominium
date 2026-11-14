using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.API.Authorization;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/autorizacaoacessotemporario")]
[Authorize]
[PermissionResource("AUTORIZACAOACESSOTEMPORARIO")]
public class AutorizacaoAcessoTemporarioController : ControllerBase
{
    private readonly AutorizacaoAcessoTemporarioRepository _repo;

    public AutorizacaoAcessoTemporarioController(AutorizacaoAcessoTemporarioRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<AutorizacaoAcessoTemporario>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idAutorizacao}")]
    public async Task<ActionResult<AutorizacaoAcessoTemporario>> GetById([FromRoute] uint? idAutorizacao, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idAutorizacao, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<AutorizacaoAcessoTemporario>> Create([FromBody] AutorizacaoAcessoTemporario entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idAutorizacao = created.IdAutorizacao }, created);
    }

    [HttpPut("{idAutorizacao}")]
    public async Task<IActionResult> Update([FromRoute] uint? idAutorizacao, [FromBody] AutorizacaoAcessoTemporario entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idAutorizacao}")]
    public async Task<IActionResult> Delete([FromRoute] uint? idAutorizacao, CancellationToken ct = default)
        => await _repo.DeleteAsync(idAutorizacao, ct) ? NoContent() : NotFound();
}
