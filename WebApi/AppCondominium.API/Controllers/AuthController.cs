using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AppCondominium.Application.Interfaces;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace AppCondominium.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ICondominioContext _condominio;

    public AuthController(AppDbContext db, IConfiguration config, ICondominioContext condominio)
    {
        _db = db;
        _config = config;
        _condominio = condominio;
    }

    public record LoginRequest(string Usuario, string Senha, uint? IdCondominio);
    public record LoginResponse(string Token, uint IdCondominio, string Perfil, string Nome);

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Usuario) || string.IsNullOrWhiteSpace(req.Senha))
            return BadRequest("Usuário e senha são obrigatórios.");
        if (!req.IdCondominio.HasValue)
            return BadRequest("IdCondominio é obrigatório (RT-Gerais 12).");

        var email = req.Usuario.Trim().ToLowerInvariant();
        var pf = await _db.Set<Domain.Entities.Pessoafisica>()
            .FirstOrDefaultAsync(p => p.Email != null && p.Email.ToLower() == email, ct);

        if (pf == null || string.IsNullOrEmpty(pf.Senha) || pf.Senha != req.Senha)
            return Unauthorized("Credenciais inválidas.");

        var vinculo = await _db.Set<Domain.Entities.PessoaCondominio>()
            .FirstOrDefaultAsync(v => v.IdPessoa == pf.IdPessoa && v.IdCondominio == req.IdCondominio, ct);

        if (vinculo == null)
        {
            var temUnidade = await (
                from pu in _db.Set<Domain.Entities.PessoaUnidade>()
                join u in _db.Set<Domain.Entities.Unidade>() on pu.IdUnidade equals u.IdUnidade
                where pu.IdPessoa == (int)pf.IdPessoa && u.IdCondominio == req.IdCondominio
                select pu).AnyAsync(ct);
            if (!temUnidade)
                return Unauthorized("Usuário sem vínculo neste condomínio (RN-Gerais 1e).");
        }

        var pessoa = await _db.Set<Domain.Entities.Pessoa>()
            .FirstOrDefaultAsync(p => p.IdPessoa == pf.IdPessoa, ct);

        var perfil = vinculo?.TipoVinculo?.ToString() ?? "Morador";
        var token = BuildToken((ulong)(pf.IdPessoa ?? 0), req.IdCondominio.Value, perfil, pessoa?.Nome ?? email);
        _condominio.SetCondominio(req.IdCondominio.Value);

        return Ok(new LoginResponse(token, req.IdCondominio.Value, perfil, pessoa?.Nome ?? email));
    }

    [AllowAnonymous]
    [HttpGet("condominios")]
    public async Task<ActionResult<IEnumerable<object>>> ListCondominios([FromQuery] string? q, CancellationToken ct)
    {
        var query = _db.Set<Domain.Entities.Condominio>().AsNoTracking();
        if (!string.IsNullOrWhiteSpace(q) && q.Length >= 3)
            query = query.Where(c => c.Nome != null && c.Nome.Contains(q));
        var items = await query.OrderBy(c => c.Nome).Take(15).Select(c => new { c.IdCondominio, c.Nome }).ToListAsync(ct);
        return Ok(items);
    }

    private string BuildToken(ulong idPessoa, uint idCondominio, string perfil, string nome)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _config["Jwt:Key"] ?? "AppCondominium-ChaveSecreta-JWT-Minimo32Caracteres!"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, idPessoa.ToString()),
            new Claim(ClaimTypes.Name, nome),
            new Claim(ClaimTypes.Role, perfil),
            new Claim("idCondominio", idCondominio.ToString())
        };
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "AppCondominium",
            audience: _config["Jwt:Audience"] ?? "AppCondominium-App",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
