using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.Infrastructure.Services;

public class TenantAccessService : ITenantAccessService
{
    private readonly AppDbContext _db;

    public TenantAccessService(AppDbContext db) => _db = db;

    public async Task<bool> UsuarioTemAcessoAsync(uint idPessoa, uint idCondominio, CancellationToken ct = default)
    {
        var viaCondominio = await _db.PessoaCondominio.IgnoreQueryFilters()
            .AnyAsync(v => v.IdPessoa == idPessoa && v.IdCondominio == idCondominio, ct);
        if (viaCondominio)
            return true;

        return await (
            from pu in _db.PessoaUnidade.IgnoreQueryFilters()
            join u in _db.Unidade.IgnoreQueryFilters() on pu.IdUnidade equals u.IdUnidade
            where pu.IdPessoa == idPessoa && u.IdCondominio == idCondominio
            select pu).AnyAsync(ct);
    }

    public async Task<IReadOnlyList<Condominio>> ListarCondominiosAutorizadosAsync(
        uint idPessoa, string? filtroNome, CancellationToken ct = default)
    {
        var porVinculo = await _db.PessoaCondominio.IgnoreQueryFilters()
            .Where(v => v.IdPessoa == idPessoa && v.IdCondominio != null)
            .Select(v => v.IdCondominio!.Value)
            .ToListAsync(ct);

        var porUnidade = await (
            from pu in _db.PessoaUnidade.IgnoreQueryFilters()
            join u in _db.Unidade.IgnoreQueryFilters() on pu.IdUnidade equals u.IdUnidade
            where pu.IdPessoa == idPessoa && u.IdCondominio != null
            select u.IdCondominio!.Value).ToListAsync(ct);

        var ids = porVinculo.Concat(porUnidade).Distinct().ToList();
        var query = _db.Condominio.IgnoreQueryFilters().AsNoTracking()
            .Where(c => c.IdCondominio != null && ids.Contains(c.IdCondominio.Value));

        if (!string.IsNullOrWhiteSpace(filtroNome) && filtroNome.Length >= 3)
            query = query.Where(c => c.Nome != null && c.Nome.Contains(filtroNome));

        return await query.OrderBy(c => c.Nome).Take(15).ToListAsync(ct);
    }

    public async Task<uint?> ResolverIdPessoaPorEmailAsync(string email, CancellationToken ct = default)
    {
        var normalizado = email.Trim().ToLowerInvariant();
        var pf = await _db.Pessoafisica.IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.Email != null && p.Email.ToLower() == normalizado, ct);
        return pf?.IdPessoa;
    }
}
