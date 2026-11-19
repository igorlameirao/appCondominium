using System.Security.Claims;
using AppCondominium.API.Authorization;
using AppCondominium.API.Storage;
using AppCondominium.Application.DTOs;
using AppCondominium.Application.Interfaces;
using AppCondominium.Application.Storage;
using AppCondominium.Domain.Vinculos;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
    private readonly AppDbContext _db;
    private readonly ArquivoAplicacao _arquivos;
    private readonly StorageObjectKeyBuilder _chaves;
    private readonly IFaceEmbeddingSync _embedding;

    public PessoaContextoController(
        IPessoaContextoInclusaoService inclusao,
        IColaboradorService colaborador,
        IPermissionResolver perms,
        ICondominioContext condominio,
        AppDbContext db,
        ArquivoAplicacao arquivos,
        StorageObjectKeyBuilder chaves,
        IFaceEmbeddingSync embedding)
    {
        _inclusao = inclusao;
        _colaborador = colaborador;
        _perms = perms;
        _condominio = condominio;
        _db = db;
        _arquivos = arquivos;
        _chaves = chaves;
        _embedding = embedding;
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

    public record FotoPerfilStatusDto(bool TemFoto, bool TemEmbedding);

    [HttpGet("{idPessoa:uint}/foto/status")]
    public async Task<ActionResult<FotoPerfilStatusDto>> FotoStatus(uint idPessoa, [FromQuery] string? contexto, CancellationToken ct)
    {
        if (!await Pode(contexto, "Visualizar", ct)) return Forbid();
        if (!await EhPessoaFisicaAsync(idPessoa, ct)) return NotFound();
        var temFoto = await _arquivos.LerAsync(_chaves.FotoPerfil(idPessoa), somenteCabecalho: true, ct) is NoContentResult;
        var pf = await _db.Pessoafisica.IgnoreQueryFilters().AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdPessoa == idPessoa, ct);
        var temEmbedding = !string.IsNullOrWhiteSpace(pf?.FotoEmbedding);
        return Ok(new FotoPerfilStatusDto(temFoto, temEmbedding));
    }

    [HttpGet("{idPessoa:uint}/foto")]
    [HttpHead("{idPessoa:uint}/foto")]
    public async Task<IActionResult> Foto(uint idPessoa, [FromQuery] string? contexto, CancellationToken ct)
    {
        if (!await Pode(contexto, "Visualizar", ct)) return Forbid();
        if (!await EhPessoaFisicaAsync(idPessoa, ct)) return NotFound();
        return await _arquivos.LerAsync(_chaves.FotoPerfil(idPessoa), HttpMethods.IsHead(Request.Method), ct);
    }

    [HttpPut("{idPessoa:uint}/foto")]
    [RequestSizeLimit(StorageMedia.FotoPerfilMaxBytes + 1024)]
    public async Task<IActionResult> SalvarFoto(uint idPessoa, [FromQuery] string? contexto, IFormFile? arquivo, CancellationToken ct)
    {
        if (!await Pode(contexto, "Alterar", ct)) return Forbid();
        if (!await EhPessoaFisicaAsync(idPessoa, ct)) return NotFound();

        var resultado = await _arquivos.SalvarAsync(
            arquivo, _chaves.FotoPerfil(idPessoa), StorageMedia.FotoPerfilMaxBytes, StorageMedia.ImagensPerfil, ct);
        if (resultado is NoContentResult)
            await _embedding.RecalcularAsync(idPessoa, ct);
        return resultado;
    }

    [HttpDelete("{idPessoa:uint}/foto")]
    public async Task<IActionResult> RemoverFoto(uint idPessoa, [FromQuery] string? contexto, CancellationToken ct)
    {
        if (!await Pode(contexto, "Alterar", ct)) return Forbid();
        if (!await EhPessoaFisicaAsync(idPessoa, ct)) return NotFound();

        var resultado = await _arquivos.ExcluirAsync(_chaves.FotoPerfil(idPessoa), ct);
        await _embedding.InvalidarAsync(idPessoa, ct);
        return resultado;
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
            else if (string.Equals(def.Id, "ocupante-proprietario", StringComparison.OrdinalIgnoreCase))
                chaves.AddRange(["OCUPANTESPROPRIETARIOS", "MORADORES", "PROPRIETARIOS", "LOCATARIOS"]);
            else if (string.Equals(def.Id, "gestores", StringComparison.OrdinalIgnoreCase))
                chaves.AddRange(["GESTORES", "SINDICOS", "SUBSINDICOS", "CONSELHEIROS", "ADMINISTRADORAS"]);
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

    private Task<bool> EhPessoaFisicaAsync(uint idPessoa, CancellationToken ct)
        => _db.Pessoafisica.IgnoreQueryFilters().AsNoTracking().AnyAsync(p => p.IdPessoa == idPessoa, ct);
}
