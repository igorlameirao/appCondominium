using AppCondominium.API.Authorization;
using AppCondominium.Application.DTOs;
using AppCondominium.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AppCondominium.API.Controllers;

[ApiController]
[Route("api/configuracao-email")]
[Authorize]
[RequireAcessoTotal]
[PermissionResource("CONFIGURACAOEMAIL")]
public class ConfiguracaoEmailController : ControllerBase
{
    private readonly IConfiguracaoEmailService _service;

    public ConfiguracaoEmailController(IConfiguracaoEmailService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ConfiguracaoEmailDto>> Obter(CancellationToken ct)
    {
        var dto = await _service.ObterAsync(ct);
        return dto == null ? Ok(new ConfiguracaoEmailDto()) : Ok(dto);
    }

    [HttpPut]
    public async Task<ActionResult<ConfiguracaoEmailDto>> Salvar([FromBody] ConfiguracaoEmailUpsertDto dto, CancellationToken ct)
    {
        try
        {
            return Ok(await _service.SalvarAsync(dto, ct));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("testar-conexao")]
    public async Task<ActionResult<EmailTesteConexaoResultadoDto>> TestarConexao(CancellationToken ct)
        => Ok(await _service.TestarConexaoAsync(ct));

    [HttpPost("enviar-teste")]
    public async Task<ActionResult<EmailTesteEnvioResultadoDto>> EnviarTeste(
        [FromBody] EmailTesteEnvioRequestDto dto, CancellationToken ct)
        => Ok(await _service.EnviarTesteAsync(dto, ct));
}