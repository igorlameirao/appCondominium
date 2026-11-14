using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AppCondominium.API.Authorization;
using AppCondominium.Application.Authorization;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
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
    private readonly IUsuarioIdentificacaoService _usuarioIdentificacao;
    private readonly IWebHostEnvironment _env;

    public AuthController(
        AppDbContext db,
        IConfiguration config,
        ICondominioContext condominio,
        ITenantAccessService access,
        IPermissionResolver permissions,
        IPasswordHasher passwordHasher,
        IUsuarioIdentificacaoService usuarioIdentificacao,
        IWebHostEnvironment env)
    {
        _db = db;
        _config = config;
        _condominio = condominio;
        _access = access;
        _permissions = permissions;
        _passwordHasher = passwordHasher;
        _usuarioIdentificacao = usuarioIdentificacao;
        _env = env;
    }

    public record LoginRequest(string Usuario, string Senha, uint? IdCondominio, uint? IdPerfil = null);
    public record CredenciaisRequest(string Usuario, string Senha);
    public record LoginResponse(string Token, uint IdCondominio, string Perfil, string Nome, bool AcessoTotal, IReadOnlyList<string> Permissoes);
    public record TrocarCondominioRequest(uint IdCondominio, uint? IdPerfil = null);
    public record TrocarPerfilRequest(uint IdPerfil);
    public record MinhaUnidadeItem(uint IdUnidade, string Descricao);

    [AllowAnonymous]
    [HttpPost("vinculos")]
    public async Task<ActionResult<IReadOnlyList<CondominioVinculo>>> ListarVinculos([FromBody] CredenciaisRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Usuario) || string.IsNullOrWhiteSpace(req.Senha))
            return BadRequest("Usuário e senha são obrigatórios.");

        var pf = await AutenticarAsync(req.Usuario, req.Senha, ct);
        if (pf?.IdPessoa == null)
            return Unauthorized("Credenciais inválidas.");

        var vinculos = await _access.ListarVinculosAsync(pf.IdPessoa.Value, ct);
        return Ok(vinculos);
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Usuario) || string.IsNullOrWhiteSpace(req.Senha))
            return BadRequest("Usuário e senha são obrigatórios.");
        if (!req.IdCondominio.HasValue)
            return BadRequest("IdCondominio é obrigatório (RT-Gerais 12).");

        var pf = await AutenticarAsync(req.Usuario, req.Senha, ct);
        if (pf?.IdPessoa == null)
            return Unauthorized("Credenciais inválidas.");

        PermissionSnapshot sessao;
        if (req.IdPerfil.HasValue)
        {
            if (!await _access.UsuarioTemPerfilAsync(pf.IdPessoa.Value, req.IdCondominio.Value, req.IdPerfil.Value, ct))
                return Unauthorized("Usuário sem este perfil no condomínio.");
            sessao = await _permissions.SnapshotPorPerfilAsync(pf.IdPessoa.Value, req.IdCondominio.Value, req.IdPerfil.Value, ct);
        }
        else
        {
            if (!await _access.UsuarioTemAcessoAsync(pf.IdPessoa.Value, req.IdCondominio.Value, ct))
                return Unauthorized("Usuário sem vínculo neste condomínio (RN-Gerais 1e).");
            sessao = await _permissions.SnapshotAsync(pf.IdPessoa.Value, req.IdCondominio.Value, ct);
        }

        var email = req.Usuario.Trim().ToLowerInvariant();
        var pessoa = await _db.Pessoa.IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.IdPessoa == pf.IdPessoa, ct);
        var nome = pessoa?.Nome ?? email;
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
        PermissionSnapshot sessao;
        if (req.IdPerfil.HasValue)
        {
            if (!await _access.UsuarioTemPerfilAsync(idPessoa.Value, req.IdCondominio, req.IdPerfil.Value, ct))
                return Forbid();
            sessao = await _permissions.SnapshotPorPerfilAsync(idPessoa.Value, req.IdCondominio, req.IdPerfil.Value, ct);
        }
        else
        {
            sessao = await _permissions.SnapshotAsync(idPessoa.Value, req.IdCondominio, ct);
        }

        var token = BuildToken(idPessoa.Value, req.IdCondominio, sessao.Perfil, nome, sessao.AcessoTotal, sessao.Permissoes);
        _condominio.SetCondominio(req.IdCondominio);
        return Ok(new LoginResponse(token, req.IdCondominio, sessao.Perfil, nome, sessao.AcessoTotal, sessao.Permissoes));
    }

    [Authorize]
    [HttpPost("trocar-perfil")]
    public async Task<ActionResult<LoginResponse>> TrocarPerfil([FromBody] TrocarPerfilRequest req, CancellationToken ct)
    {
        var idPessoa = IdPessoaAtual();
        if (!idPessoa.HasValue)
            return Unauthorized();

        uint idCondominio;
        try
        {
            idCondominio = _condominio.RequireTenantId();
        }
        catch (InvalidOperationException)
        {
            return Forbid();
        }

        if (!await _access.UsuarioTemPerfilAsync(idPessoa.Value, idCondominio, req.IdPerfil, ct))
            return Forbid();

        var nome = User.Identity?.Name ?? "";
        var sessao = await _permissions.SnapshotPorPerfilAsync(idPessoa.Value, idCondominio, req.IdPerfil, ct);
        var token = BuildToken(idPessoa.Value, idCondominio, sessao.Perfil, nome, sessao.AcessoTotal, sessao.Permissoes);
        _condominio.SetCondominio(idCondominio);
        return Ok(new LoginResponse(token, idCondominio, sessao.Perfil, nome, sessao.AcessoTotal, sessao.Permissoes));
    }

    /// <summary>Vínculos ativos do usuário autenticado (mesmo contrato de POST vinculos).</summary>
    [Authorize]
    [HttpGet("vinculos-ativos")]
    public async Task<ActionResult<IReadOnlyList<CondominioVinculo>>> ListarVinculosAtivos(CancellationToken ct)
    {
        var idPessoa = IdPessoaAtual();
        if (!idPessoa.HasValue)
            return Unauthorized();

        var vinculos = await _access.ListarVinculosAsync(idPessoa.Value, ct);
        return Ok(vinculos);
    }

    [Authorize]
    [HttpGet("minhas-unidades")]
    public async Task<ActionResult<IReadOnlyList<MinhaUnidadeItem>>> MinhasUnidades(CancellationToken ct)
    {
        var idPessoa = IdPessoaAtual();
        if (!idPessoa.HasValue)
            return Unauthorized();

        uint idCondominio;
        try
        {
            idCondominio = _condominio.RequireTenantId();
        }
        catch (InvalidOperationException)
        {
            return Forbid();
        }

        var hoje = DateOnly.FromDateTime(DateTime.UtcNow);
        var items = await (
            from pu in _db.PessoaUnidade.IgnoreQueryFilters()
            join u in _db.Unidade.IgnoreQueryFilters() on pu.IdUnidade equals u.IdUnidade
            join b in _db.Bloco.IgnoreQueryFilters() on u.IdBloco equals b.IdBloco into blocoJoin
            from b in blocoJoin.DefaultIfEmpty()
            where pu.IdPessoa == idPessoa
                  && u.IdCondominio == idCondominio
                  && (pu.DataInicio == null || pu.DataInicio <= hoje)
                  && (pu.DataFim == null || pu.DataFim >= hoje)
            orderby b != null ? b.Descricao : null, u.Numero, u.IdUnidade
            select new MinhaUnidadeItem(
                u.IdUnidade!.Value,
                FormatarDescricaoUnidade(b != null ? b.Descricao : null, u.Numero)))
            .ToListAsync(ct);

        return Ok(items);
    }

    private static string FormatarDescricaoUnidade(string? bloco, uint? numero)
    {
        var partes = new List<string>(2);
        if (!string.IsNullOrWhiteSpace(bloco))
            partes.Add(bloco.Trim());
        if (numero.HasValue)
            partes.Add($"Apto {numero}");
        return partes.Count > 0 ? string.Join(" — ", partes) : "Unidade";
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
            : string.IsNullOrWhiteSpace(usuario) ? null : await _usuarioIdentificacao.ResolverIdPessoaPorUsuarioAsync(usuario, ct);

        if (!idPessoa.HasValue)
            return Ok(Array.Empty<object>());

        var items = await _access.ListarCondominiosAutorizadosAsync(idPessoa.Value, q, ct);
        return Ok(items.Select(c => new { c.IdCondominio, c.Nome }));
    }

    private async Task<Pessoafisica?> AutenticarAsync(string usuario, string senha, CancellationToken ct)
    {
        var pf = await _usuarioIdentificacao.ResolverPessoafisicaPorUsuarioAsync(usuario, ct);
        if (pf?.IdPessoa == null || string.IsNullOrEmpty(pf.Senha) || !_passwordHasher.Verify(senha, pf.Senha))
            return null;
        return pf;
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
