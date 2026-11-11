using System.Security.Claims;
using AppCondominium.API.Authorization;
using AppCondominium.Application.Authorization;
using AppCondominium.Application.Interfaces;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.API.Controllers;

[ApiController]
[Route("api/Permissao")]
[Authorize]
public class PermissaoController : ControllerBase
{
    private readonly IPermissionResolver _resolver;
    private readonly ICondominioContext _tenant;
    private readonly AppDbContext _db;

    public PermissaoController(IPermissionResolver resolver, ICondominioContext tenant, AppDbContext db)
    {
        _resolver = resolver;
        _tenant = tenant;
        _db = db;
    }

    [HttpGet("minhas")]
    public async Task<ActionResult<PermissionSnapshot>> Minhas(CancellationToken ct)
    {
        var ids = Ids();
        if (ids == null)
            return Unauthorized();
        return Ok(await _resolver.SnapshotAsync(ids.Value.IdPessoa, ids.Value.IdCondominio, ct));
    }

    [HttpGet("opcoes-perfil")]
    public async Task<ActionResult<IEnumerable<object>>> OpcoesPerfil(CancellationToken ct)
    {
        var items = await _db.PerfilAcesso.AsNoTracking()
            .OrderBy(p => p.Descricao)
            .Select(p => new { p.IdPerfil, p.Descricao })
            .ToListAsync(ct);
        return Ok(items);
    }

    [HttpGet("perfis")]
    [PermissionResource("PERMISSOES_GERENCIAR")]
    public async Task<ActionResult<IEnumerable<object>>> Perfis(CancellationToken ct)
    {
        var items = await _db.PerfilAcesso.AsNoTracking()
            .OrderBy(p => p.Descricao)
            .Select(p => new { p.IdPerfil, p.Descricao })
            .ToListAsync(ct);
        return Ok(items);
    }

    [HttpGet("perfil/{id}")]
    [PermissionResource("PERMISSOES_GERENCIAR")]
    public async Task<ActionResult<IReadOnlyList<PermissaoLinha>>> Matriz(uint id, CancellationToken ct)
        => Ok(await _resolver.MatrizPerfilAsync(id, ct));

    [HttpPut("perfil/{id}")]
    [PermissionResource("PERMISSOES_GERENCIAR")]
    public async Task<IActionResult> SalvarMatriz(uint id, [FromBody] List<PermissaoLinha> linhas, CancellationToken ct)
    {
        await _resolver.SaveMatrizPerfilAsync(id, linhas ?? [], ct);
        return NoContent();
    }

    [HttpGet("pessoas")]
    [PermissionResource("PERMISSOES_GERENCIAR")]
    public async Task<ActionResult<IEnumerable<object>>> Pessoas(CancellationToken ct)
    {
        if (_tenant.IdCondominio is not uint idCondominio)
            return Unauthorized();
        var pessoas = await (
            from v in _db.PessoaCondominio.AsNoTracking()
            join p in _db.Pessoa.IgnoreQueryFilters().AsNoTracking() on v.IdPessoa equals p.IdPessoa
            join pf in _db.PerfilAcesso.AsNoTracking() on v.IdPerfil equals pf.IdPerfil into perfis
            from pf in perfis.DefaultIfEmpty()
            where v.IdCondominio == idCondominio && v.IdPessoa != null
            orderby p.Nome
            select new
            {
                idPessoa = v.IdPessoa!.Value,
                nome = p.Nome,
                idPerfil = v.IdPerfil,
                perfilDescricao = pf != null ? pf.Descricao : null
            }).ToListAsync(ct);
        return Ok(pessoas);
    }

    [HttpGet("pessoa/{idPessoa}/excecoes")]
    [PermissionResource("PERMISSOES_GERENCIAR")]
    public async Task<ActionResult<IReadOnlyList<PermissaoLinha>>> Excecoes(uint idPessoa, CancellationToken ct)
    {
        if (_tenant.IdCondominio is not uint idCondominio)
            return Unauthorized();
        if (!await PessoaNoTenant(idPessoa, idCondominio, ct))
            return NotFound();
        return Ok(await _resolver.ExcecoesAsync(idPessoa, idCondominio, ct));
    }

    [HttpPut("pessoa/{idPessoa}/excecoes")]
    [PermissionResource("PERMISSOES_GERENCIAR")]
    public async Task<IActionResult> SalvarExcecoes(uint idPessoa, [FromBody] List<PermissaoLinha> linhas, CancellationToken ct)
    {
        if (_tenant.IdCondominio is not uint idCondominio)
            return Unauthorized();
        if (!await PessoaNoTenant(idPessoa, idCondominio, ct))
            return NotFound();
        await _resolver.SaveExcecoesAsync(idPessoa, idCondominio, linhas ?? [], ct);
        return NoContent();
    }

    private (uint IdPessoa, uint IdCondominio)? Ids()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!uint.TryParse(raw, out var idPessoa) || _tenant.IdCondominio is not uint idCondominio)
            return null;
        return (idPessoa, idCondominio);
    }

    private Task<bool> PessoaNoTenant(uint idPessoa, uint idCondominio, CancellationToken ct)
        => _db.PessoaCondominio.IgnoreQueryFilters().AnyAsync(v => v.IdPessoa == idPessoa && v.IdCondominio == idCondominio, ct);
}
