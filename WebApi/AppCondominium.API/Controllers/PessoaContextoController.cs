using System.Security.Claims;
using AppCondominium.API.Authorization;
using AppCondominium.Application.DTOs;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Vinculos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AppCondominium.API.Controllers;

[ApiController]
[Route("api/pessoas/contexto")]
[Authorize]
public class PessoaContextoController : ControllerBase
{
    private readonly IPessoaContextoInclusaoService _inclusao;
    private readonly IColaboradorService _colaborador;
    private readonly IPermissionResolver _perms;
    private readonly ICondominioContext _condominio;

    public PessoaContextoController(
        IPessoaContextoInclusaoService inclusao,
        IColaboradorService colaborador,
        IPermissionResolver perms,
        ICondominioContext condominio)
    {
        _inclusao = inclusao;
        _colaborador = colaborador;
        _perms = perms;
        _condominio = condominio;
    }

    [HttpPost]
    public Task<IActionResult> Incluir([FromBody] PessoaContextoGravacaoRequest request, CancellationToken ct)
        => Gravar(request, null, "Incluir", ct);

    [HttpPut("{idPessoa:uint}")]
    public Task<IActionResult> Alterar(uint idPessoa, [FromBody] PessoaContextoGravacaoRequest request, CancellationToken ct)
        => Gravar(request, idPessoa, "Alterar", ct);

    [HttpGet("{idPessoa:uint}/colaborador")]
    public async Task<IActionResult> Colaborador(uint idPessoa, [FromQuery] string? contexto, CancellationToken ct)
    {
        if (!await Pode(contexto, "Visualizar", ct)) return Forbid();
        return Ok(await _colaborador.ConsultarAsync(idPessoa, ct));
    }

    private async Task<IActionResult> Gravar(PessoaContextoGravacaoRequest request, uint? idPessoa, string acao, CancellationToken ct)
    {
        if (!await Pode(request.ContextoId, acao, ct)) return Forbid();
        try
        {
            var r = await _inclusao.GravarAsync(request, idPessoa, ct);
            return Ok(r);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    private async Task<bool> Pode(string? contextoId, string acao, CancellationToken ct)
    {
        var def = PessoaContextoCatalogo.Obter(contextoId);
        var chaves = new List<string>();
        if (def != null)
        {
            if (string.Equals(def.Id, "colaborador", StringComparison.OrdinalIgnoreCase))
                chaves.AddRange(["COLABORADORES", "FUNCIONARIOS", "TERCEIRIZADOS"]);
            else
                chaves.Add(def.PermissionKey);
        }
        chaves.Add("PESSOAFISICA");
        chaves.Add("PESSOAJURIDICA");
        chaves.Add("PESSOAVINCULO");
        if (def?.Id == "fornecedor") chaves.Add("FORNECEDOR");

        foreach (var chave in chaves)
        {
            if (PermissionResourceAttribute.PermissaoNoToken(User, chave, acao)) return true;
        }

        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!uint.TryParse(raw, out var idPessoa) || _condominio.IdCondominio is not uint idCondominio)
            return false;
        foreach (var chave in chaves)
        {
            if (await _perms.HasAsync(idPessoa, idCondominio, chave, acao, ct)) return true;
        }
        return false;
    }
}
