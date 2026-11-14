using AppCondominium.API.Authorization;
using AppCondominium.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AppCondominium.API.Controllers;

[ApiController]
[Route("api/fornecedor")]
[Authorize]
[PermissionResource("FORNECEDOR")]
public class FornecedorConsultaController : ControllerBase
{
    private readonly IFornecedorConsultaService _consulta;

    public FornecedorConsultaController(IFornecedorConsultaService consulta) => _consulta = consulta;

    [HttpGet("listagem")]
    public async Task<IActionResult> Listar(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? filter = null,
        CancellationToken ct = default)
        => Ok(await _consulta.ListarAsync(page, pageSize, filter, ct));
}