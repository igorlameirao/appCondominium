using System.Security.Claims;
using AppCondominium.API.Authorization;
using AppCondominium.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AppCondominium.API.Controllers;

[ApiController]
[Route("api/convites")]
public class ConvitesController : ControllerBase
{
    private readonly IConviteAcessoService _convites;

    public ConvitesController(IConviteAcessoService convites) => _convites = convites;

    [Authorize]
    [PermissionResource("CONVITEACESSO")]
    [HttpPost]
    public async Task<ActionResult<EmitirConviteResponse>> Emitir(
        [FromBody] EmitirConviteRequest request, CancellationToken ct)
    {
        var idPessoa = RequireIdPessoa();
        var resp = await _convites.EmitirAsync(idPessoa, request, ct);
        return Ok(resp);
    }

    [Authorize]
    [PermissionResource("CONVITEACESSO")]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ConviteListItemDto>>> Listar(
        [FromQuery] string? email, CancellationToken ct)
    {
        var idCondominio = RequireTenant();
        var items = await _convites.ListarAsync(idCondominio, email, ct);
        return Ok(items);
    }

    [Authorize]
    [HttpPost("{id:uint}/reenviar")]
    public async Task<ActionResult<EmitirConviteResponse>> Reenviar(uint id, CancellationToken ct)
    {
        await RequirePermissaoAsync("Alterar", ct);
        var resp = await _convites.ReenviarAsync(id, RequireIdPessoa(), ct);
        return Ok(resp);
    }

    [Authorize]
    [HttpPost("{id:uint}/revogar")]
    public async Task<IActionResult> Revogar(uint id, CancellationToken ct)
    {
        await RequirePermissaoAsync("Alterar", ct);
        await _convites.RevogarAsync(id, RequireIdPessoa(), ct);
        return NoContent();
    }

    [AllowAnonymous]
    [EnableRateLimiting("convites-publicos")]
    [HttpGet("validar")]
    public async Task<ActionResult<ValidarConviteResponse>> Validar([FromQuery] string token, CancellationToken ct)
    {
        var resp = await _convites.ValidarTokenAsync(token, ct);
        return Ok(resp);
    }

    [AllowAnonymous]
    [EnableRateLimiting("convites-publicos")]
    [HttpPost("aceitar")]
    public async Task<ActionResult<AceitarConviteResponse>> Aceitar(
        [FromBody] AceitarConvitePublicoBody body, CancellationToken ct)
    {
        if (User.Identity?.IsAuthenticated == true
            && body.Modo?.Equals("autenticado", StringComparison.OrdinalIgnoreCase) == true)
        {
            var resp = await _convites.AceitarAutenticadoAsync(
                RequireIdPessoa(),
                new AceitarConviteAutenticadoRequest(body.Token),
                ct);
            return Ok(resp);
        }

        if (body.Nome is null || body.Cpf is null || body.Email is null || body.Senha is null
            || body.DataNascimento is null)
            return BadRequest(new { title = "Dados insuficientes para ativação da conta." });

        var conta = await _convites.AceitarContaNovaAsync(new AceitarConviteContaNovaRequest(
            body.Token,
            body.Nome,
            body.Cpf,
            body.Email,
            body.DataNascimento.Value,
            body.Senha,
            body.Telefone), ct);

        return Ok(conta);
    }

    public record AceitarConvitePublicoBody(
        string Token,
        string? Modo,
        string? Nome,
        string? Cpf,
        string? Email,
        DateOnly? DataNascimento,
        string? Senha,
        string? Telefone);

    private uint RequireIdPessoa()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!uint.TryParse(raw, out var id))
            throw new InvalidOperationException("Usuário não identificado.");
        return id;
    }

    private uint RequireTenant()
    {
        var claim = User.FindFirst("idCondominio")?.Value;
        if (!uint.TryParse(claim, out var id))
            throw new InvalidOperationException("Tenant ausente.");
        return id;
    }

    private async Task RequirePermissaoAsync(string acao, CancellationToken ct)
    {
        if (PermissionResourceAttribute.PermissaoNoToken(User, "CONVITEACESSO", acao))
            return;

        var idPessoa = RequireIdPessoa();
        var idCondominio = RequireTenant();
        var resolver = HttpContext.RequestServices.GetRequiredService<IPermissionResolver>();
        if (!await resolver.HasAsync(idPessoa, idCondominio, "CONVITEACESSO", acao, ct))
            throw new UnauthorizedAccessException("Sem permissão.");
    }
}