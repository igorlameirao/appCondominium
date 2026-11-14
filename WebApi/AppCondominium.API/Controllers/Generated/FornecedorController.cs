using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.API.Authorization;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/fornecedor")]
[Authorize]
[PermissionResource("FORNECEDOR")]
public class FornecedorController : ControllerBase
{
    private readonly FornecedorRepository _repo;

    public FornecedorController(FornecedorRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<Fornecedor>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idFornecedor}")]
    public async Task<ActionResult<Fornecedor>> GetById([FromRoute] uint? idFornecedor, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idFornecedor, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<Fornecedor>> Create([FromBody] Fornecedor entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idFornecedor = created.IdFornecedor }, created);
    }

    [HttpPut("{idFornecedor}")]
    public async Task<IActionResult> Update([FromRoute] uint? idFornecedor, [FromBody] Fornecedor entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idFornecedor}")]
    public async Task<IActionResult> Delete([FromRoute] uint? idFornecedor, CancellationToken ct = default)
        => await _repo.DeleteAsync(idFornecedor, ct) ? NoContent() : NotFound();
}
