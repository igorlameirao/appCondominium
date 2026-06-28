using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/alocacaomaterial")]
[Authorize]
public class AlocacaoMaterialController : ControllerBase
{
    private readonly AlocacaoMaterialRepository _repo;

    public AlocacaoMaterialController(AlocacaoMaterialRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<AlocacaoMaterial>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idAlocacaoMaterial}")]
    public async Task<ActionResult<AlocacaoMaterial>> GetById([FromRoute] uint? idAlocacaoMaterial, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idAlocacaoMaterial, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<AlocacaoMaterial>> Create([FromBody] AlocacaoMaterial entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idAlocacaoMaterial = created.IdAlocacaoMaterial }, created);
    }

    [HttpPut("{idAlocacaoMaterial}")]
    public async Task<IActionResult> Update([FromRoute] uint? idAlocacaoMaterial, [FromBody] AlocacaoMaterial entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idAlocacaoMaterial}")]
    public async Task<IActionResult> Delete([FromRoute] uint? idAlocacaoMaterial, CancellationToken ct = default)
        => await _repo.DeleteAsync(idAlocacaoMaterial, ct) ? NoContent() : NotFound();
}
