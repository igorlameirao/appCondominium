using AppCondominium.API.Authorization;
using AppCondominium.Application.Common;
using AppCondominium.Application.DTOs;
using AppCondominium.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AppCondominium.API.Controllers;

[ApiController]
[Route("api/fila-email")]
[Authorize]
[RequireAcessoTotal]
[PermissionResource("FILAEMAIL")]
public class FilaEmailController : ControllerBase
{
    private readonly IEmailQueueConsultaService _service;

    public FilaEmailController(IEmailQueueConsultaService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<PagedResult<EmailQueueListItemDto>>> Search(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? destinatario = null,
        [FromQuery] string? assunto = null,
        [FromQuery] DateOnly? dataInicio = null,
        [FromQuery] DateOnly? dataFim = null,
        CancellationToken ct = default)
    {
        if (page < 1) page = 1;
        pageSize = Math.Clamp(pageSize, 1, 100);
        var filtro = new EmailQueueFiltroDto
        {
            Status = status,
            Destinatario = destinatario,
            Assunto = assunto,
            DataInicio = dataInicio,
            DataFim = dataFim
        };
        return Ok(await _service.SearchPagedAsync(page, pageSize, filtro, ct));
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<EmailQueueDetalheDto>> GetById(long id, CancellationToken ct)
    {
        var r = await _service.GetByIdAsync(id, ct);
        return r == null ? NotFound() : Ok(r);
    }

    [HttpPost("{id:long}/reprocessar")]
    public async Task<ActionResult<EmailQueueReprocessarResultadoDto>> Reprocessar(long id, CancellationToken ct)
    {
        var r = await _service.ReprocessarAsync(id, ct);
        if (r.Item == null && !r.Ok) return NotFound(r);
        return Ok(r);
    }

    [HttpPost("{id:long}/resetar-tentativas")]
    public async Task<ActionResult<EmailQueueReprocessarResultadoDto>> ResetarTentativas(long id, CancellationToken ct)
    {
        var r = await _service.ResetarTentativasAsync(id, ct);
        if (r.Item == null && !r.Ok) return NotFound(r);
        return Ok(r);
    }
}