using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.Application.Common;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/configuracaocondominio")]
[Authorize]
public class ConfiguracaoCondominioController : ControllerBase
{
    private readonly ConfiguracaoCondominioRepository _repo;

    public ConfiguracaoCondominioController(ConfiguracaoCondominioRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<ConfiguracaoCondominio>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idConfiguracao}")]
    public async Task<ActionResult<ConfiguracaoCondominio>> GetById([FromRoute] uint? idConfiguracao, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idConfiguracao, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<ConfiguracaoCondominio>> Create([FromBody] ConfiguracaoCondominio entity, CancellationToken ct = default)
    {
        var created = await _repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(GetById), new { idConfiguracao = created.IdConfiguracao }, created);
    }

    [HttpPut("{idConfiguracao}")]
    public async Task<IActionResult> Update([FromRoute] uint? idConfiguracao, [FromBody] ConfiguracaoCondominio entity, CancellationToken ct = default)
    {
        await _repo.UpdateAsync(entity, ct);
        return NoContent();
    }

    [HttpDelete("{idConfiguracao}")]
    public async Task<IActionResult> Delete([FromRoute] uint? idConfiguracao, CancellationToken ct = default)
        => await _repo.DeleteAsync(idConfiguracao, ct) ? NoContent() : NotFound();
}
