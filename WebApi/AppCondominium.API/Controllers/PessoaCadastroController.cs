using AppCondominium.API.Authorization;
using AppCondominium.Application.DTOs;
using AppCondominium.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AppCondominium.API.Controllers;

[ApiController]
[Authorize]
public class PessoaCadastroController : ControllerBase
{
    private readonly IPessoaCadastroService _cadastro;

    public PessoaCadastroController(IPessoaCadastroService cadastro) => _cadastro = cadastro;

    [HttpPost("api/pessoafisica/cadastro-integrado")]
    [PermissionResource("PESSOAFISICA")]
    public async Task<ActionResult<PessoaFisicaIntegradaResponse>> CriarPessoaFisica(
        [FromBody] PessoaFisicaIntegradaRequest request, CancellationToken ct)
    {
        try
        {
            return Ok(await _cadastro.CriarOuAtualizarPessoaFisicaAsync(request, null, ct));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("api/pessoafisica/cadastro-integrado/{idPessoa:uint}")]
    [PermissionResource("PESSOAFISICA")]
    public async Task<ActionResult<PessoaFisicaIntegradaResponse>> AtualizarPessoaFisica(
        uint idPessoa, [FromBody] PessoaFisicaIntegradaRequest request, CancellationToken ct)
    {
        try
        {
            return Ok(await _cadastro.CriarOuAtualizarPessoaFisicaAsync(request, idPessoa, ct));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("api/pessoajuridica/cadastro-integrado")]
    [PermissionResource("PESSOAJURIDICA")]
    public async Task<ActionResult<PessoaJuridicaIntegradaResponse>> CriarPessoaJuridica(
        [FromBody] PessoaJuridicaIntegradaRequest request, CancellationToken ct)
    {
        try
        {
            return Ok(await _cadastro.CriarOuAtualizarPessoaJuridicaAsync(request, null, ct));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("api/pessoafisica/cadastro-integrado/{idPessoa:uint}")]
    [PermissionResource("PESSOAFISICA")]
    public async Task<ActionResult<PessoaFisicaIntegradaResponse>> ObterPessoaFisica(uint idPessoa, CancellationToken ct)
    {
        var r = await _cadastro.ObterPessoaFisicaIntegradaAsync(idPessoa, ct);
        return r is null ? NotFound() : Ok(r);
    }

    [HttpGet("api/pessoajuridica/cadastro-integrado/{idPessoa:uint}")]
    [PermissionResource("PESSOAJURIDICA")]
    public async Task<ActionResult<PessoaJuridicaIntegradaResponse>> ObterPessoaJuridica(uint idPessoa, CancellationToken ct)
    {
        var r = await _cadastro.ObterPessoaJuridicaIntegradaAsync(idPessoa, ct);
        return r is null ? NotFound() : Ok(r);
    }

    [HttpPut("api/pessoajuridica/cadastro-integrado/{idPessoa:uint}")]
    [PermissionResource("PESSOAJURIDICA")]
    public async Task<ActionResult<PessoaJuridicaIntegradaResponse>> AtualizarPessoaJuridica(
        uint idPessoa, [FromBody] PessoaJuridicaIntegradaRequest request, CancellationToken ct)
    {
        try
        {
            return Ok(await _cadastro.CriarOuAtualizarPessoaJuridicaAsync(request, idPessoa, ct));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}