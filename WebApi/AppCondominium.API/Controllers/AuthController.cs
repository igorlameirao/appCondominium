using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AppCondominium.API.Authorization;
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
    private readonly ITenantAccessService _access;
    private readonly IPermissionResolver _permissions;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IWebHostEnvironment _env;

    public AuthController(
        AppDbContext db,
        IConfiguration config,
        ICondominioContext condominio,
        ITenantAccessService access,
        IPermissionResolver permissions,
        IPasswordHasher passwordHasher,
        IWebHostEnvironment env)
    {
        _db = db;
        _config = config;
        _condominio = condominio;
        _access = access;
        _permissions = permissions;
        _passwordHasher = passwordHasher;
        _env = env;
    }

    public record LoginRequest(string Usuario, string Senha, uint? IdCondominio);
    public record LoginResponse(string Token, uint IdCondominio, string Perfil, string Nome, bool AcessoTotal, IReadOnlyList<string> Permissoes);
    public record TrocarCondominioRequest(uint IdCondominio);

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Usuario) || string.IsNullOrWhiteSpace(req.Senha))
            return BadRequest("Usuário e senha são obrigatórios.");
        if (!req.IdCondominio.HasValue)
            return BadRequest("IdCondominio é obrigatório (RT-Gerais 12).");

        var email = req.Usuario.Trim().ToLowerInvariant();
        var pf = await _db.Pessoafisica.IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.Email != null && p.Email.ToLower() == email, ct);
        if (pf?.IdPessoa == null || string.IsNullOrEmpty(pf.Senha) || !_passwordHasher.Verify(req.Senha, pf.Senha))
            return Unauthorized("Credenciais inválidas.");

        if (!await _access.UsuarioTemAcessoAsync(pf.IdPessoa.Value, req.IdCondominio.Value, ct))
            return Unauthorized("Usuário sem vínculo neste condomínio (RN-Gerais 1e).");

        var pessoa = await _db.Pessoa.IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.IdPessoa == pf.IdPessoa, ct);
        var nome = pessoa?.Nome ?? email;
        var sessao = await _permissions.SnapshotAsync(pf.IdPessoa.Value, req.IdCondominio.Value, ct);
        var token = BuildToken(pf.IdPessoa.Value, req.IdCondominio.Value, sessao.Perfil, nome, sessao.AcessoTotal, sessao.Permissoes);
        _condominio.SetCondominio(req.IdCondominio.Value);
        return Ok(new LoginResponse(token, req.IdCondominio.Value, sessao.Perfil, nome, sessao.AcessoTotal, sessao.Permissoes));
    }

    [Authorize]
    [HttpPost("trocar-condominio")]
    public async Task<ActionResult<LoginResponse>> TrocarCondominio([FromBody] TrocarCondominioRequest req, CancellationToken ct)
    {
        var idPessoa = IdPessoaAtual();
        if (!idPessoa.HasValue)
            return Unauthorized();
        if (!await _access.UsuarioTemAcessoAsync(idPessoa.Value, req.IdCondominio, ct))
            return Forbid();

        var nome = User.Identity?.Name ?? "";
        var sessao = await _permissions.SnapshotAsync(idPessoa.Value, req.IdCondominio, ct);
        var token = BuildToken(idPessoa.Value, req.IdCondominio, sessao.Perfil, nome, sessao.AcessoTotal, sessao.Permissoes);
        _condominio.SetCondominio(req.IdCondominio);
        return Ok(new LoginResponse(token, req.IdCondominio, sessao.Perfil, nome, sessao.AcessoTotal, sessao.Permissoes));
    }

    /// <summary>Gera hash BCrypt para scripts SQL (somente Development).</summary>
    [AllowAnonymous]
    [HttpGet("hash")]
    public IActionResult GetHash([FromQuery] string? senha)
    {
        if (!_env.IsDevelopment())
            return NotFound();
        var password = string.IsNullOrEmpty(senha) ? "Admin@123456" : senha;
        return Ok(new { hash = _passwordHasher.Hash(password), senha = password });
    }

    [AllowAnonymous]
    [HttpGet("condominios")]
    public async Task<ActionResult<IEnumerable<object>>> ListCondominios([FromQuery] string? q, [FromQuery] string? usuario, CancellationToken ct)
    {
        uint? idPessoa = User.Identity?.IsAuthenticated == true
            ? IdPessoaAtual()
            : string.IsNullOrWhiteSpace(usuario) ? null : await _access.ResolverIdPessoaPorEmailAsync(usuario, ct);

        if (!idPessoa.HasValue)
            return Ok(Array.Empty<object>());

        var items = await _access.ListarCondominiosAutorizadosAsync(idPessoa.Value, q, ct);
        return Ok(items.Select(c => new { c.IdCondominio, c.Nome }));
    }

    private uint? IdPessoaAtual()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return uint.TryParse(raw, out var id) ? id : null;
    }

    private string BuildToken(
        uint idPessoa,
        uint idCondominio,
        string perfil,
        string nome,
        bool acessoTotal,
        IReadOnlyList<string> permissoes)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _config["Jwt:Key"] ?? "AppCondominium-ChaveSecreta-JWT-Minimo32Caracteres!"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, idPessoa.ToString()),
            new(ClaimTypes.Name, nome),
            new(ClaimTypes.Role, perfil),
            new("idCondominio", idCondominio.ToString())
        };
        if (acessoTotal)
            claims.Add(new Claim(PermissionClaimTypes.AcessoTotal, "1"));
        else
        {
            foreach (var perm in permissoes)
                claims.Add(new Claim(PermissionClaimTypes.Permissao, perm));
        }
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "AppCondominium",
            audience: _config["Jwt:Audience"] ?? "AppCondominium-App",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
