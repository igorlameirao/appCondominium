using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.API.Authorization;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/dadosbancarios")]
[Authorize]
[PermissionResource("DADOSBANCARIOS")]
public class DadosBancariosController : ControllerBase
{
    private readonly DadosBancariosRepository _repo;

    public DadosBancariosController(DadosBancariosRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<DadosBancarios>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{conta}/{idBanco}/{agencia}")]
    public async Task<ActionResult<DadosBancarios>> GetById([FromRoute] uint? conta, [FromRoute] uint? idBanco, [FromRoute] string? agencia, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(conta, idBanco, agencia, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<DadosBancarios>> Create([FromBody] DadosBancarios entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { conta = created.Conta, idBanco = created.IdBanco, agencia = created.Agencia }, created);
    }

    [HttpPut("{conta}/{idBanco}/{agencia}")]
    public async Task<IActionResult> Update([FromRoute] uint? conta, [FromRoute] uint? idBanco, [FromRoute] string? agencia, [FromBody] DadosBancarios entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{conta}/{idBanco}/{agencia}")]
    public async Task<IActionResult> Delete([FromRoute] uint? conta, [FromRoute] uint? idBanco, [FromRoute] string? agencia, CancellationToken ct = default)
        => await _repo.DeleteAsync(conta, idBanco, agencia, ct) ? NoContent() : NotFound();
}
