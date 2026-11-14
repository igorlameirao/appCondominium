using AppCondominium.API.Authorization;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Repositories.Generated;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AppCondominium.API.Controllers;

/// <summary>Validações RN de PessoaVinculo sem alterar o CRUD gerado na rota principal.</summary>
[ApiController]
[Route("api/pessoavinculo")]
[Authorize]
[PermissionResource("PESSOAVINCULO")]
public class PessoaVinculoNegocioController : ControllerBase
{
    private readonly PessoaVinculoRepository _repo;
    private readonly IPessoaVinculoService _regras;

    public PessoaVinculoNegocioController(PessoaVinculoRepository repo, IPessoaVinculoService regras)
    {
        _repo = repo;
        _regras = regras;
    }

    [HttpPost("validado")]
    public async Task<ActionResult<PessoaVinculo>> CreateValidado([FromBody] PessoaVinculo entity, CancellationToken ct)
    {
        try
        {
            await _regras.ValidarAntesGravarAsync(entity, true, ct);
            if (entity.Responsavel is null)
                entity.Responsavel = 0;
            var created = await _repo.AddAsync(entity, ct);
            await _regras.AplicarAjustesAposGravarAsync(created, ct);
            return Created($"/api/pessoavinculo/{created.IdVinculo}", created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("validado/{idVinculo:uint}")]
    public async Task<IActionResult> UpdateValidado(uint idVinculo, [FromBody] PessoaVinculo entity, CancellationToken ct)
    {
        entity.IdVinculo = idVinculo;
        try
        {
            await _regras.ValidarAntesGravarAsync(entity, false, ct);
            await _repo.UpdateAsync(entity, ct);
            await _regras.AplicarAjustesAposGravarAsync(entity, ct);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    public record EncerrarVinculoRequest(DateOnly? DataFim);

    /// <summary>Encerra o vínculo definindo a data fim (padrão: hoje em UTC), sem exclusão física.</summary>
    [HttpPost("validado/{idVinculo:uint}/encerrar")]
    public async Task<IActionResult> Encerrar(uint idVinculo, [FromBody] EncerrarVinculoRequest? body, CancellationToken ct)
    {
        var atual = await _repo.GetByIdAsync(idVinculo, ct);
        if (atual is null) return NotFound();

        atual.DataFim = body?.DataFim ?? DateOnly.FromDateTime(DateTime.UtcNow);
        try
        {
            await _regras.ValidarAntesGravarAsync(atual, false, ct);
            await _repo.UpdateAsync(atual, ct);
            await _regras.AplicarAjustesAposGravarAsync(atual, ct);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}