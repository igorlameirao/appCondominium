using AppCondominium.API.Authorization;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Vinculos;
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
        [FromQuery] string? contexto = null,
        [FromQuery] string? escopoPapel = null,
        [FromQuery] uint[]? codigosPapel = null,
        [FromQuery] bool? vigente = null,
        CancellationToken ct = default)
    {
        var def = string.IsNullOrWhiteSpace(contexto) ? null : PessoaContextoCatalogo.Obter(contexto);
        if (def != null)
        {
            escopoPapel ??= def.EscopoPapel == "qualquer" ? null : def.EscopoPapel;
            codigosPapel ??= def.CodigosPapel;
            if (vigente is null)
            {
                vigente = situacao?.Trim().ToLowerInvariant() switch
                {
                    "ativo" => true,
                    "encerrado" => false,
                    _ => null
                };
            }
            vigente ??= true;
            if (def.TipoPessoa == "PF") tipo = "PF";
        }

        if (!await PodeListar(def, ct))
            return Forbid();

        return Ok(await _consulta.ListarAsync(page, pageSize, filter, tipo, situacao, escopoPapel, codigosPapel, vigente, ct));
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
        if (await TemPermissaoContexto("Incluir", ct)) return true;

        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!uint.TryParse(raw, out var idPessoa) || _condominio.IdCondominio is not uint idCondominio)
            return false;

        if (await _perms.HasAsync(idPessoa, idCondominio, "PESSOAFISICA", "Incluir", ct)) return true;
        if (await _perms.HasAsync(idPessoa, idCondominio, "PESSOAJURIDICA", "Incluir", ct)) return true;
        return await _perms.HasAsync(idPessoa, idCondominio, "FORNECEDOR", "Incluir", ct);
    }

    private async Task<bool> PodeListar(PessoaContextoDefinicao? def, CancellationToken ct)
    {
        if (def != null)
        {
            foreach (var key in ChavesPermissaoContexto(def))
            {
                if (PermissionResourceAttribute.PermissaoNoToken(User, key, "Visualizar")) return true;
                var rawCtx = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (uint.TryParse(rawCtx, out var idCtx) && _condominio.IdCondominio is uint condo
                    && await _perms.HasAsync(idCtx, condo, key, "Visualizar", ct))
                    return true;
            }
        }
        return await PodeVisualizarPessoas(ct);
    }

    private static IEnumerable<string> ChavesPermissaoContexto(PessoaContextoDefinicao def)
    {
        if (string.Equals(def.Id, "colaborador", StringComparison.OrdinalIgnoreCase))
            return ["COLABORADORES", "FUNCIONARIOS", "TERCEIRIZADOS"];
        if (string.Equals(def.Id, "ocupante-proprietario", StringComparison.OrdinalIgnoreCase))
            return ["OCUPANTESPROPRIETARIOS", "MORADORES", "PROPRIETARIOS", "LOCATARIOS"];
        if (string.Equals(def.Id, "gestores", StringComparison.OrdinalIgnoreCase))
            return ["GESTORES", "SINDICOS", "SUBSINDICOS", "CONSELHEIROS", "ADMINISTRADORAS"];
        return [def.PermissionKey];
    }

    private async Task<bool> TemPermissaoContexto(string acao, CancellationToken ct)
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        uint.TryParse(raw, out var idPessoa);
        var idCondominio = _condominio.IdCondominio;
        foreach (var def in PessoaContextoCatalogo.Todos)
        {
            if (PermissionResourceAttribute.PermissaoNoToken(User, def.PermissionKey, acao)) return true;
            if (idPessoa > 0 && idCondominio is uint condo
                && await _perms.HasAsync(idPessoa, condo, def.PermissionKey, acao, ct))
                return true;
        }
        return false;
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