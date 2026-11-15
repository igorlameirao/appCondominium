using AppCondominium.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AppCondominium.API.Controllers;

[ApiController]
[Route("api/auth/recuperacao-senha")]
public class PasswordRecoveryController : ControllerBase
{
    private readonly IPasswordRecoveryService _recuperacao;

    public PasswordRecoveryController(IPasswordRecoveryService recuperacao) => _recuperacao = recuperacao;

  public record SolicitarBody(string Email);
  public record RedefinirBody(string Token, string SenhaNova, string? SenhaConfirmacao);

    [AllowAnonymous]
    [EnableRateLimiting("recuperacao-senha-publicos")]
    [HttpPost("solicitar")]
    public async Task<ActionResult<SolicitarRecuperacaoSenhaResponse>> Solicitar(
        [FromBody] SolicitarBody body, CancellationToken ct)
    {
        var resp = await _recuperacao.SolicitarAsync(body.Email ?? "", ct);
        return Ok(resp);
    }

    [AllowAnonymous]
    [EnableRateLimiting("recuperacao-senha-publicos")]
    [HttpGet("validar")]
    public async Task<ActionResult<ValidarRecuperacaoSenhaResponse>> Validar(
        [FromQuery] string token, CancellationToken ct)
    {
        var resp = await _recuperacao.ValidarTokenAsync(token ?? "", ct);
        return Ok(resp);
    }

    [AllowAnonymous]
    [EnableRateLimiting("recuperacao-senha-publicos")]
    [HttpPost("redefinir")]
    public async Task<ActionResult<RedefinirSenhaRecuperacaoResponse>> Redefinir(
        [FromBody] RedefinirBody body, CancellationToken ct)
    {
        if (body.SenhaConfirmacao is not null
            && !string.Equals(body.SenhaNova, body.SenhaConfirmacao, StringComparison.Ordinal))
            return BadRequest(new RedefinirSenhaRecuperacaoResponse(false, "As senhas não conferem."));

        var resp = await _recuperacao.RedefinirAsync(
            new RedefinirSenhaRecuperacaoRequest(body.Token ?? "", body.SenhaNova ?? ""), ct);
        if (!resp.Sucesso)
            return BadRequest(resp);
        return Ok(resp);
    }
}