using Microsoft.EntityFrameworkCore;
using MySqlConnector;
using AppCondominium.Application.Common;
using AppCondominium.Application.Exceptions;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;

namespace AppCondominium.Infrastructure.Repositories.Generated;

public class BancoRepository
{
    private const string MensagemCodigoDuplicado = "Já existe um banco cadastrado com este Código Banco.";
    private const string MensagemIspbDuplicado = "Já existe um banco cadastrado com este ISPB.";
    private const string MensagemBancoEmUso = "Não é possível excluir: o banco está vinculado a dados bancários.";

    private readonly AppDbContext _ctx;
    private readonly ICondominioContext _condominio;

    public BancoRepository(AppDbContext ctx, ICondominioContext condominio)
    {
        _ctx = ctx;
        _condominio = condominio;
    }

    private IQueryable<Banco> BaseQuery() => _ctx.Set<Banco>();

    private IQueryable<Banco> ApplyCondominioFilter(IQueryable<Banco> query)
    {
        return query;
    }

    public async Task<PagedResult<Banco>> GetPagedAsync(int page, int pageSize, string? filter, CancellationToken ct = default)
    {
        var query = ApplyCondominioFilter(BaseQuery().AsNoTracking());

        if (!string.IsNullOrWhiteSpace(filter) && filter.Trim().Length >= 3)
        {
            var termo = filter.Trim();
            query = query.Where(e =>
                (e.CodigoBanco != null && e.CodigoBanco.Contains(termo))
                || (e.Nome != null && e.Nome.Contains(termo))
                || (e.ISPB != null && e.ISPB.Contains(termo)));
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderBy(e => e.CodigoBanco == null)
            .ThenBy(e => e.CodigoBanco)
            .ThenBy(e => e.Nome)
            .ThenBy(e => e.IdBanco)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);
        return new PagedResult<Banco> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<Banco?> GetByIdAsync(uint? idBanco, CancellationToken ct = default)
    {
        var q = ApplyCondominioFilter(BaseQuery());
        return await q.FirstOrDefaultAsync(e => e.IdBanco == idBanco, ct);
    }

    public Task<bool> ExistsAsync(uint idBanco, CancellationToken ct = default) =>
        BaseQuery().AsNoTracking().AnyAsync(e => e.IdBanco == idBanco, ct);

    /// <summary>Retorna a mensagem de conflito quando CodigoBanco ou ISPB já pertencem a outro banco.</summary>
    public async Task<string?> VerificarUnicidadeAsync(Banco entity, CancellationToken ct = default)
    {
        var outros = BaseQuery().AsNoTracking().Where(e => e.IdBanco != entity.IdBanco);
        if (entity.CodigoBanco != null && await outros.AnyAsync(e => e.CodigoBanco == entity.CodigoBanco, ct))
            return MensagemCodigoDuplicado;
        if (entity.ISPB != null && await outros.AnyAsync(e => e.ISPB == entity.ISPB, ct))
            return MensagemIspbDuplicado;
        return null;
    }

    public async Task<Banco> AddAsync(Banco entity, CancellationToken ct = default)
    {
        entity.IdBanco = null;
        await _ctx.Set<Banco>().AddAsync(entity, ct);
        await SalvarAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(Banco entity, CancellationToken ct = default)
    {
        _ctx.Set<Banco>().Update(entity);
        await SalvarAsync(ct);
    }

    public async Task<bool> DeleteAsync(uint? idBanco, CancellationToken ct = default)
    {
        var e = await GetByIdAsync(idBanco, ct);
        if (e == null) return false;
        if (await _ctx.Set<DadosBancarios>().IgnoreQueryFilters().AnyAsync(d => d.IdBanco == idBanco, ct))
            throw new RegistroConflitanteException(MensagemBancoEmUso);
        _ctx.Set<Banco>().Remove(e);
        await SalvarAsync(ct);
        return true;
    }

    private async Task SalvarAsync(CancellationToken ct)
    {
        try
        {
            await _ctx.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is MySqlException mysql)
        {
            var mensagem = mysql.ErrorCode switch
            {
                MySqlErrorCode.DuplicateKeyEntry when mysql.Message.Contains("uq_Banco_ISPB", StringComparison.OrdinalIgnoreCase) => MensagemIspbDuplicado,
                MySqlErrorCode.DuplicateKeyEntry when mysql.Message.Contains("uq_Banco_CodigoBanco", StringComparison.OrdinalIgnoreCase) => MensagemCodigoDuplicado,
                MySqlErrorCode.RowIsReferenced2 => MensagemBancoEmUso,
                _ => null,
            };
            if (mensagem == null) throw;
            throw new RegistroConflitanteException(mensagem, ex);
        }
    }
}
