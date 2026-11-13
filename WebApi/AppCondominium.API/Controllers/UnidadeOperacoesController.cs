using AppCondominium.API.Authorization;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.API.Controllers;

[ApiController]
[Route("api/unidade")]
[Authorize]
[PermissionResource("UNIDADE")]
public class UnidadeOperacoesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICondominioContext _condominio;

    public UnidadeOperacoesController(AppDbContext db, ICondominioContext condominio)
    {
        _db = db;
        _condominio = condominio;
    }

    public record BlocoComUnidadesDto(uint IdBloco, string? Descricao);

    public record CopiarBlocoRequest(uint IdBlocoOrigem, uint IdBlocoDestino);

    public record CopiarBlocoResult(int Criadas, int Alteradas, int Ignoradas);

    public record UnidadeCopiaLinhaDto(
        uint? Numero,
        uint? IdTipoUnidadeOrigem,
        string? TipoUnidadeOrigem,
        uint? IdTipoUnidadeDestino,
        string? TipoUnidadeDestino,
        uint? IdUnidadeDestino);

    public record CopiarBlocoPreviaDto(
        IReadOnlyList<UnidadeCopiaLinhaDto> Criar,
        IReadOnlyList<UnidadeCopiaLinhaDto> Alterar,
        IReadOnlyList<UnidadeCopiaLinhaDto> Ignorar);

    private sealed record PlanoCopiaBloco(
        List<(Unidade Origem, Unidade? Destino)> Criar,
        List<(Unidade Origem, Unidade Destino)> Alterar,
        List<(Unidade Origem, Unidade Destino)> Ignorar);

    /// <summary>Blocos do condomínio que possuem ao menos uma unidade cadastrada.</summary>
    [HttpGet("blocos-com-unidades")]
    public async Task<ActionResult<IReadOnlyList<BlocoComUnidadesDto>>> BlocosComUnidades(CancellationToken ct)
    {
        var tenantId = _condominio.RequireTenantId();

        var idsBloco = await _db.Unidade.AsNoTracking()
            .Where(u => u.IdCondominio == tenantId && u.IdBloco != null)
            .Select(u => u.IdBloco!.Value)
            .Distinct()
            .ToListAsync(ct);

        if (idsBloco.Count == 0)
            return Ok(Array.Empty<BlocoComUnidadesDto>());

        var blocos = await _db.Bloco.AsNoTracking()
            .Where(b => b.IdCondominio == tenantId && idsBloco.Contains(b.IdBloco!.Value))
            .OrderBy(b => b.Descricao)
            .Select(b => new BlocoComUnidadesDto(b.IdBloco!.Value, b.Descricao))
            .ToListAsync(ct);

        return Ok(blocos);
    }

    [HttpGet("copiar-bloco/previa")]
    public async Task<ActionResult<CopiarBlocoPreviaDto>> PreviaCopiarBloco(
        [FromQuery] uint idBlocoOrigem,
        [FromQuery] uint idBlocoDestino,
        CancellationToken ct)
    {
        var err = await ValidarBlocosCopiaAsync(idBlocoOrigem, idBlocoDestino, ct);
        if (err != null)
            return BadRequest(err);

        var tenantId = _condominio.RequireTenantId();
        var plano = await MontarPlanoCopiaAsync(tenantId, idBlocoOrigem, idBlocoDestino, ct);
        return Ok(await MapearPreviaAsync(plano, ct));
    }

    /// <summary>Replica ou alinha unidades do bloco origem no bloco destino (por número).</summary>
    [HttpPost("copiar-bloco")]
    public async Task<ActionResult<CopiarBlocoResult>> CopiarBloco([FromBody] CopiarBlocoRequest req, CancellationToken ct)
    {
        var err = await ValidarBlocosCopiaAsync(req.IdBlocoOrigem, req.IdBlocoDestino, ct);
        if (err != null)
            return BadRequest(err);

        var tenantId = _condominio.RequireTenantId();
        var plano = await MontarPlanoCopiaAsync(tenantId, req.IdBlocoOrigem, req.IdBlocoDestino, ct);

        foreach (var (origem, _) in plano.Criar)
        {
            var nova = new Unidade
            {
                IdCondominio = tenantId,
                IdBloco = req.IdBlocoDestino,
                IdTipoUnidade = origem.IdTipoUnidade,
                Numero = origem.Numero,
                IdHidrometro = null,
            };
            await _db.Unidade.AddAsync(nova, ct);
        }

        foreach (var (origem, destino) in plano.Alterar)
        {
            var entidade = await _db.Unidade.FirstOrDefaultAsync(
                u => u.IdUnidade == destino.IdUnidade && u.IdCondominio == tenantId, ct);
            if (entidade == null) continue;
            entidade.IdTipoUnidade = origem.IdTipoUnidade;
        }

        if (plano.Criar.Count > 0 || plano.Alterar.Count > 0)
            await _db.SaveChangesAsync(ct);

        return Ok(new CopiarBlocoResult(plano.Criar.Count, plano.Alterar.Count, plano.Ignorar.Count));
    }

    private async Task<string?> ValidarBlocosCopiaAsync(uint idBlocoOrigem, uint idBlocoDestino, CancellationToken ct)
    {
        if (idBlocoOrigem == idBlocoDestino)
            return "O bloco de origem e o de destino devem ser diferentes.";

        var tenantId = _condominio.RequireTenantId();

        var origemExiste = await _db.Unidade.AsNoTracking()
            .AnyAsync(u => u.IdCondominio == tenantId && u.IdBloco == idBlocoOrigem, ct);
        if (!origemExiste)
            return "O bloco de origem não possui unidades para copiar.";

        var destinoExiste = await _db.Bloco.AsNoTracking()
            .AnyAsync(b => b.IdCondominio == tenantId && b.IdBloco == idBlocoDestino, ct);
        if (!destinoExiste)
            return "Bloco de destino inválido.";

        return null;
    }

    private async Task<PlanoCopiaBloco> MontarPlanoCopiaAsync(
        uint tenantId,
        uint idBlocoOrigem,
        uint idBlocoDestino,
        CancellationToken ct)
    {
        var unidadesOrigem = await _db.Unidade.AsNoTracking()
            .Where(u => u.IdCondominio == tenantId && u.IdBloco == idBlocoOrigem)
            .OrderBy(u => u.Numero ?? uint.MaxValue)
            .ThenBy(u => u.IdUnidade)
            .ToListAsync(ct);

        var unidadesDestino = await _db.Unidade.AsNoTracking()
            .Where(u => u.IdCondominio == tenantId && u.IdBloco == idBlocoDestino)
            .ToListAsync(ct);

        var destinoPorNumero = unidadesDestino
            .Where(u => u.Numero != null)
            .GroupBy(u => u.Numero!.Value)
            .ToDictionary(g => g.Key, g => g.First());

        var criar = new List<(Unidade Origem, Unidade? Destino)>();
        var alterar = new List<(Unidade Origem, Unidade Destino)>();
        var ignorar = new List<(Unidade Origem, Unidade Destino)>();

        foreach (var origem in unidadesOrigem)
        {
            if (origem.Numero is not uint numero || !destinoPorNumero.TryGetValue(numero, out var destino))
            {
                criar.Add((origem, null));
                continue;
            }

            if (origem.IdTipoUnidade == destino.IdTipoUnidade)
                ignorar.Add((origem, destino));
            else
                alterar.Add((origem, destino));
        }

        return new PlanoCopiaBloco(criar, alterar, ignorar);
    }

    private async Task<CopiarBlocoPreviaDto> MapearPreviaAsync(PlanoCopiaBloco plano, CancellationToken ct)
    {
        var idsTipo = plano.Criar.Select(x => x.Origem.IdTipoUnidade)
            .Concat(plano.Alterar.SelectMany(x => new[] { x.Origem.IdTipoUnidade, x.Destino.IdTipoUnidade }))
            .Concat(plano.Ignorar.SelectMany(x => new[] { x.Origem.IdTipoUnidade, x.Destino.IdTipoUnidade }))
            .Where(id => id != null)
            .Select(id => id!.Value)
            .Distinct()
            .ToList();

        var descricoes = idsTipo.Count == 0
            ? new Dictionary<uint, string>()
            : await _db.TipoUnidade.AsNoTracking()
                .Where(t => idsTipo.Contains(t.IdTipoUnidade!.Value))
                .ToDictionaryAsync(t => t.IdTipoUnidade!.Value, t => t.Descricao ?? string.Empty, ct);

        string Desc(uint? id) => id is uint k && descricoes.TryGetValue(k, out var d) ? d : string.Empty;

        UnidadeCopiaLinhaDto LinhaCriar(Unidade o) => new(
            o.Numero,
            o.IdTipoUnidade,
            Desc(o.IdTipoUnidade),
            null,
            null,
            null);

        UnidadeCopiaLinhaDto LinhaPar(Unidade o, Unidade d) => new(
            o.Numero,
            o.IdTipoUnidade,
            Desc(o.IdTipoUnidade),
            d.IdTipoUnidade,
            Desc(d.IdTipoUnidade),
            d.IdUnidade);

        return new CopiarBlocoPreviaDto(
            plano.Criar.Select(x => LinhaCriar(x.Origem)).ToList(),
            plano.Alterar.Select(x => LinhaPar(x.Origem, x.Destino)).ToList(),
            plano.Ignorar.Select(x => LinhaPar(x.Origem, x.Destino)).ToList());
    }
}
