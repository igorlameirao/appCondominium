using AppCondominium.API.Authorization;
using AppCondominium.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AppCondominium.API.Controllers;

[ApiController]
[Route("api/pessoas")]
[Authorize]
public class PessoaConsultaController : ControllerBase
{
    private readonly IPessoaConsultaService _consulta;
    private readonly IPermissionResolver _perms;
    private readonly ICondominioContext _condominio;

    public PessoaConsultaController(
        IPessoaConsultaService consulta,
        IPermissionResolver perms,
        ICondominioContext condominio)
    {
        _consulta = consulta;
        _perms = perms;
        _condominio = condominio;
    }

    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? filter = null,
        [FromQuery] string? tipo = null,
        [FromQuery] string? situacao = null,
        CancellationToken ct = default)
    {
        if (!await PodeVisualizarPessoas(ct))
            return Forbid();

        return Ok(await _consulta.ListarAsync(page, pageSize, filter, tipo, situacao, ct));
    }

    [HttpGet("por-documento")]
    public async Task<IActionResult> PorDocumento(
        [FromQuery] string? cpfcnpj,
        [FromQuery] string? finalidade,
        CancellationToken ct = default)
    {
        var cadastro = string.Equals(finalidade, "cadastro", StringComparison.OrdinalIgnoreCase);
        if (cadastro)
        {
            if (!await PodeCadastroPessoaOuFornecedor(ct)) return Forbid();
        }
        else if (!await PodeVisualizarPessoas(ct))
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(cpfcnpj))
            return BadRequest("Informe o CPF ou CNPJ.");

        var r = await _consulta.ObterPorDocumentoAsync(cpfcnpj, cadastro, ct);
        return r is null ? NotFound() : Ok(r);
    }

    private async Task<bool> PodeCadastroPessoaOuFornecedor(CancellationToken ct)
    {
        if (PermissionResourceAttribute.PermissaoNoToken(User, "PESSOAFISICA", "Incluir")) return true;
        if (PermissionResourceAttribute.PermissaoNoToken(User, "PESSOAJURIDICA", "Incluir")) return true;
        if (PermissionResourceAttribute.PermissaoNoToken(User, "FORNECEDOR", "Incluir")) return true;

        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!uint.TryParse(raw, out var idPessoa) || _condominio.IdCondominio is not uint idCondominio)
            return false;

        if (await _perms.HasAsync(idPessoa, idCondominio, "PESSOAFISICA", "Incluir", ct)) return true;
        if (await _perms.HasAsync(idPessoa, idCondominio, "PESSOAJURIDICA", "Incluir", ct)) return true;
        return await _perms.HasAsync(idPessoa, idCondominio, "FORNECEDOR", "Incluir", ct);
    }

    private async Task<bool> PodeVisualizarPessoas(CancellationToken ct)
    {
        if (PermissionResourceAttribute.PermissaoNoToken(User, "PESSOAFISICA", "Visualizar")) return true;
        if (PermissionResourceAttribute.PermissaoNoToken(User, "PESSOAJURIDICA", "Visualizar")) return true;

        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!uint.TryParse(raw, out var idPessoa) || _condominio.IdCondominio is not uint idCondominio)
            return false;

        if (await _perms.HasAsync(idPessoa, idCondominio, "PESSOAFISICA", "Visualizar", ct)) return true;
        return await _perms.HasAsync(idPessoa, idCondominio, "PESSOAJURIDICA", "Visualizar", ct);
    }
}