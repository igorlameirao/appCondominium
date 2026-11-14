using AppCondominium.API.Authorization;
using AppCondominium.Application.DTOs;
using AppCondominium.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AppCondominium.API.Controllers;

[ApiController]
[Route("api/pessoas/{idPessoa:uint}/enderecos")]
[Authorize]
public class PessoaEnderecoController : ControllerBase
{
    private readonly IPessoaEnderecoService _service;
    private readonly IPermissionResolver _perms;
    private readonly ICondominioContext _condominio;

    public PessoaEnderecoController(IPessoaEnderecoService service, IPermissionResolver perms, ICondominioContext condominio)
    {
        _service = service;
        _perms = perms;
        _condominio = condominio;
    }

    [HttpGet]
    public async Task<IActionResult> Listar(uint idPessoa, CancellationToken ct)
    {
        if (!await PodeVisualizar(ct)) return Forbid();
        try
        {
            return Ok(await _service.ListarPorPessoaAsync(idPessoa, ct));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPost]
    public async Task<IActionResult> Gravar(uint idPessoa, [FromBody] PessoaEnderecoUpsertRequest request, CancellationToken ct)
    {
        if (!await PodeAlterar(ct)) return Forbid();
        try
        {
            var item = await _service.GravarAsync(idPessoa, request, ct);
            return Ok(item);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{idEndereco:uint}")]
    public async Task<IActionResult> Atualizar(uint idPessoa, uint idEndereco, [FromBody] PessoaEnderecoUpsertRequest request, CancellationToken ct)
    {
        if (!await PodeAlterar(ct)) return Forbid();
        request.IdEndereco = idEndereco;
        try
        {
            return Ok(await _service.GravarAsync(idPessoa, request, ct));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{idEndereco:uint}")]
    public async Task<IActionResult> Remover(uint idPessoa, uint idEndereco, CancellationToken ct)
    {
        if (!await PodeAlterar(ct)) return Forbid();
        try
        {
            await _service.RemoverAsync(idPessoa, idEndereco, ct);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    private async Task<bool> PodeVisualizar(CancellationToken ct)
    {
        if (PermissionResourceAttribute.PermissaoNoToken(User, "PESSOAFISICA", "Visualizar")) return true;
        if (PermissionResourceAttribute.PermissaoNoToken(User, "PESSOAJURIDICA", "Visualizar")) return true;
        return await TemPermissaoAsync("Visualizar", ct);
    }

    private async Task<bool> PodeAlterar(CancellationToken ct)
    {
        if (PermissionResourceAttribute.PermissaoNoToken(User, "PESSOAFISICA", "Alterar")) return true;
        if (PermissionResourceAttribute.PermissaoNoToken(User, "PESSOAJURIDICA", "Alterar")) return true;
        if (PermissionResourceAttribute.PermissaoNoToken(User, "FORNECEDOR", "Alterar")) return true;
        return await TemPermissaoAsync("Alterar", ct);
    }

    private async Task<bool> TemPermissaoAsync(string acao, CancellationToken ct)
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!uint.TryParse(raw, out var idPessoa) || _condominio.IdCondominio is not uint idCondominio)
            return false;
        if (await _perms.HasAsync(idPessoa, idCondominio, "PESSOAFISICA", acao, ct)) return true;
        if (await _perms.HasAsync(idPessoa, idCondominio, "PESSOAJURIDICA", acao, ct)) return true;
        return await _perms.HasAsync(idPessoa, idCondominio, "FORNECEDOR", acao, ct);
    }
}