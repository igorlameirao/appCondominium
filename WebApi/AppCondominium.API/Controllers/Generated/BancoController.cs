using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppCondominium.API.Authorization;
using AppCondominium.Application.Common;
using AppCondominium.Application.Exceptions;
using AppCondominium.Domain.Entities;
using AppCondominium.Domain.Validators;
using AppCondominium.Infrastructure.Repositories.Generated;

namespace AppCondominium.API.Controllers.Generated;

[ApiController]
[Route("api/banco")]
[Authorize]
[PermissionResource("BANCO")]
public class BancoController : ControllerBase
{
    private readonly BancoRepository _repo;

    public BancoController(BancoRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<ActionResult<PagedResult<Banco>>> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null, CancellationToken ct = default)
        => Ok(await _repo.GetPagedAsync(page, pageSize, filter, ct));

    [HttpGet("{idBanco}")]
    public async Task<ActionResult<Banco>> GetById([FromRoute] uint idBanco, CancellationToken ct = default)
    {
        var item = await _repo.GetByIdAsync(idBanco, ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<Banco>> Create([FromBody] BancoRequest request, CancellationToken ct = default)
    {
        var entity = request.ToEntity();
        var invalido = await ValidarAsync(entity, ct);
        if (invalido != null) return invalido;

        try
        {
            var created = await _repo.AddAsync(entity, ct);
            return CreatedAtAction(nameof(GetById), new { idBanco = created.IdBanco }, created);
        }
        catch (RegistroConflitanteException ex)
        {
            return Conflict(ex.Message);
        }
    }

    [HttpPut("{idBanco}")]
    public async Task<IActionResult> Update([FromRoute] uint idBanco, [FromBody] BancoRequest request, CancellationToken ct = default)
    {
        if (!await _repo.ExistsAsync(idBanco, ct)) return NotFound();

        var entity = request.ToEntity(idBanco);
        var invalido = await ValidarAsync(entity, ct);
        if (invalido != null) return invalido;

        try
        {
            await _repo.UpdateAsync(entity, ct);
            return NoContent();
        }
        catch (RegistroConflitanteException ex)
        {
            return Conflict(ex.Message);
        }
    }

    [HttpDelete("{idBanco}")]
    public async Task<IActionResult> Delete([FromRoute] uint idBanco, CancellationToken ct = default)
    {
        try
        {
            return await _repo.DeleteAsync(idBanco, ct) ? NoContent() : NotFound();
        }
        catch (RegistroConflitanteException ex)
        {
            return Conflict(ex.Message);
        }
    }

    private async Task<ActionResult?> ValidarAsync(Banco entity, CancellationToken ct)
    {
        BancoValidator.Normalizar(entity);
        var erro = BancoValidator.Validar(entity);
        if (erro != null) return BadRequest(erro);
        var conflito = await _repo.VerificarUnicidadeAsync(entity, ct);
        return conflito != null ? Conflict(conflito) : null;
    }
}
