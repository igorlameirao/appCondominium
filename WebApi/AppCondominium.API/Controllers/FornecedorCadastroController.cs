using AppCondominium.API.Authorization;
using AppCondominium.Application.DTOs;
using AppCondominium.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AppCondominium.API.Controllers;

[ApiController]
[Authorize]
public class FornecedorCadastroController : ControllerBase
{
  private readonly IFornecedorCadastroService _fornecedor;

  public FornecedorCadastroController(IFornecedorCadastroService fornecedor) => _fornecedor = fornecedor;

  [HttpPost("api/fornecedor/cadastro-integrado")]
  [PermissionResource("FORNECEDOR")]
  public async Task<ActionResult<FornecedorIntegradoResponse>> Criar(
    [FromBody] FornecedorIntegradoRequest request, CancellationToken ct)
  {
    try
    {
      return Ok(await _fornecedor.CadastrarAsync(request, ct));
    }
    catch (InvalidOperationException ex)
    {
      return BadRequest(ex.Message);
    }
  }

  [HttpGet("api/fornecedor/cadastro-integrado/{idFornecedor:uint}")]
  [PermissionResource("FORNECEDOR")]
  public async Task<ActionResult<FornecedorIntegradoRequest>> Obter(uint idFornecedor, CancellationToken ct)
  {
    var r = await _fornecedor.ObterParaEdicaoAsync(idFornecedor, ct);
    return r is null ? NotFound() : Ok(r);
  }

  [HttpPut("api/fornecedor/cadastro-integrado/{idFornecedor:uint}")]
  [PermissionResource("FORNECEDOR")]
  public async Task<ActionResult<FornecedorIntegradoResponse>> Atualizar(
    uint idFornecedor, [FromBody] FornecedorIntegradoRequest request, CancellationToken ct)
  {
    try
    {
      return Ok(await _fornecedor.AtualizarAsync(idFornecedor, request, ct));
    }
    catch (InvalidOperationException ex)
    {
      return BadRequest(ex.Message);
    }
  }
}