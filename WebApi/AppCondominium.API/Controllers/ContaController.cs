using System.Security.Claims;
using AppCondominium.API.Storage;
using AppCondominium.Application.Interfaces;
using AppCondominium.Application.Storage;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.API.Controllers;

[ApiController]
[Route("api/conta")]
[Authorize]
public class ContaController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICondominioContext _tenant;
    private readonly IPermissionResolver _permissions;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ArquivoAplicacao _arquivos;
    private readonly StorageObjectKeyBuilder _chaves;
    private readonly IFaceEmbeddingSync _embedding;

    public ContaController(
        AppDbContext db,
        ICondominioContext tenant,
        IPermissionResolver permissions,
        IPasswordHasher passwordHasher,
        ArquivoAplicacao arquivos,
        StorageObjectKeyBuilder chaves,
        IFaceEmbeddingSync embedding)
    {
        _db = db;
        _tenant = tenant;
        _permissions = permissions;
        _passwordHasher = passwordHasher;
        _arquivos = arquivos;
        _chaves = chaves;
        _embedding = embedding;
    }

    public record PerfilContaDto(string Nome, string Perfil, bool TemFoto, string? Email);
    public record AlterarSenhaRequest(string SenhaAtual, string SenhaNova);

    [HttpGet("perfil")]
    public async Task<ActionResult<PerfilContaDto>> Perfil(CancellationToken ct)
    {
        var idPessoa = IdPessoaAtual();
        if (idPessoa is not uint id || _tenant.IdCondominio is not uint idCondominio)
            return Unauthorized();

        var pessoa = await _db.Pessoa.IgnoreQueryFilters().AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdPessoa == id, ct);
        var pf = await _db.Pessoafisica.IgnoreQueryFilters().AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdPessoa == id, ct);
        var snapshot = await _permissions.SnapshotAsync(id, idCondominio, ct);
        var nome = pessoa?.Nome?.Trim() ?? User.Identity?.Name ?? "Usuário";
        var temFoto = await _arquivos.LerAsync(_chaves.FotoPerfil(id), somenteCabecalho: true, ct) is NoContentResult;
        return Ok(new PerfilContaDto(nome, snapshot.Perfil, temFoto, pf?.Email));
    }

    [HttpGet("foto")]
    [HttpHead("foto")]
    public Task<IActionResult> Foto(CancellationToken ct)
    {
        var id = IdPessoaAtual();
        if (id is not uint idPessoa)
            return Task.FromResult<IActionResult>(Unauthorized());
        return _arquivos.LerAsync(_chaves.FotoPerfil(idPessoa), HttpMethods.IsHead(Request.Method), ct);
    }

    [HttpPut("foto")]
    [RequestSizeLimit(StorageMedia.FotoPerfilMaxBytes + 1024)]
    public async Task<IActionResult> SalvarFoto(IFormFile? arquivo, CancellationToken ct)
    {
        var id = IdPessoaAtual();
        if (id is not uint idPessoa)
            return Unauthorized();
        if (await CarregarPessoaFisica(ct) == null)
            return NotFound();

        var resultado = await _arquivos.SalvarAsync(
            arquivo, _chaves.FotoPerfil(idPessoa), StorageMedia.FotoPerfilMaxBytes, StorageMedia.ImagensPerfil, ct);
        if (resultado is NoContentResult)
            await _embedding.InvalidarAsync(idPessoa, ct);
        return resultado;
    }

    [HttpDelete("foto")]
    public async Task<IActionResult> RemoverFoto(CancellationToken ct)
    {
        var id = IdPessoaAtual();
        if (id is not uint idPessoa)
            return Unauthorized();
        if (await CarregarPessoaFisica(ct) == null)
            return NotFound();

        var resultado = await _arquivos.ExcluirAsync(_chaves.FotoPerfil(idPessoa), ct);
        await _embedding.InvalidarAsync(idPessoa, ct);
        return resultado;
    }

    [HttpPut("senha")]
    public async Task<IActionResult> AlterarSenha([FromBody] AlterarSenhaRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.SenhaAtual) || string.IsNullOrWhiteSpace(req.SenhaNova))
            return BadRequest("Informe a senha atual e a nova senha.");
        if (req.SenhaNova.Trim().Length < 8)
            return BadRequest("A nova senha deve ter pelo menos 8 caracteres.");

        var pf = await CarregarPessoaFisicaMutavel(ct);
        if (pf == null || string.IsNullOrEmpty(pf.Senha))
            return NotFound();
        if (!_passwordHasher.Verify(req.SenhaAtual, pf.Senha))
            return BadRequest("Senha atual incorreta.");

        pf.Senha = _passwordHasher.Hash(req.SenhaNova.Trim());
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    private uint? IdPessoaAtual()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return uint.TryParse(raw, out var id) ? id : null;
    }

    private async Task<Domain.Entities.Pessoafisica?> CarregarPessoaFisica(CancellationToken ct)
    {
        var idPessoa = IdPessoaAtual();
        if (idPessoa is not uint id)
            return null;
        return await _db.Pessoafisica.IgnoreQueryFilters().AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdPessoa == id, ct);
    }

    private async Task<Domain.Entities.Pessoafisica?> CarregarPessoaFisicaMutavel(CancellationToken ct)
    {
        var idPessoa = IdPessoaAtual();
        if (idPessoa is not uint id)
            return null;
        return await _db.Pessoafisica.IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.IdPessoa == id, ct);
    }
}
