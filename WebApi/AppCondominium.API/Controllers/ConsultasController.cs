using AppCondominium.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AppCondominium.API.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class ConsultasController : ControllerBase
{
    [HttpGet("cnpj")]
    public async Task<IActionResult> Cnpj([FromQuery] string cnpj, [FromServices] CnpjService service, CancellationToken ct)
    {
        try
        {
            var result = await service.ConsultarAsync(cnpj, ct);
            return result is null
                ? NotFound(new { mensagem = "CNPJ não encontrado." })
                : Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { mensagem = ex.Message });
        }
    }

    [HttpGet("banco-codigo")]
    public async Task<IActionResult> BancoCodigo([FromQuery] string codigo, [FromServices] BancoCodigoService service, CancellationToken ct)
    {
        try
        {
            var result = await service.ConsultarAsync(codigo, ct);
            return result is null
                ? NotFound(new { mensagem = "Código Banco não encontrado." })
                : Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { mensagem = ex.Message });
        }
        catch (HttpRequestException)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { mensagem = "A consulta de Código Banco está indisponível no momento. Preencha os dados manualmente." });
        }
    }
}
