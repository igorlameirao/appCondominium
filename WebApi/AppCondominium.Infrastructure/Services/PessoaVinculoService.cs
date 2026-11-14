using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Domain.Vinculos;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.Infrastructure.Services;

public class PessoaVinculoService : IPessoaVinculoService
{
    private readonly AppDbContext _db;
    private readonly ICondominioContext _tenant;

    public PessoaVinculoService(AppDbContext db, ICondominioContext tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    public async Task ValidarAntesGravarAsync(PessoaVinculo entity, bool inclusao, CancellationToken ct = default)
    {
        if (entity.IdPessoa is null or 0)
            throw new InvalidOperationException("IdPessoa é obrigatório.");
        if (entity.CodigoPapelVinculo is null or 0)
            throw new InvalidOperationException("Papel de vínculo é obrigatório.");
        if (entity.DataInicio is null)
            throw new InvalidOperationException("Data de início é obrigatória.");

        var papel = await _db.PapelVinculo.IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.CodigoPapelVinculo == entity.CodigoPapelVinculo, ct)
            ?? throw new InvalidOperationException("Papel de vínculo inexistente.");

        var escopo = papel.EscopoPapel ?? 0;
        if (escopo == EscopoPapelVinculo.Unidade)
        {
            if (entity.IdUnidade is null or 0)
                throw new InvalidOperationException("Unidade é obrigatória para este papel.");
        }
        else if (entity.IdUnidade is not null and not 0)
            throw new InvalidOperationException("Unidade deve ficar vazia para este escopo de papel.");

        if (escopo == EscopoPapelVinculo.Pessoa)
        {
            if (entity.IdPessoaRelacionada is null or 0)
                throw new InvalidOperationException("Pessoa relacionada é obrigatória.");
            if (entity.IdPessoaRelacionada == entity.IdPessoa)
                throw new InvalidOperationException("Pessoa relacionada deve ser distinta da pessoa do vínculo.");
        }
        else if (entity.IdPessoaRelacionada is not null and not 0)
            throw new InvalidOperationException("Pessoa relacionada só é permitida no escopo Pessoa.");

        if (entity.IdUnidade is uint idUnidade)
        {
            var unidade = await _db.Unidade.IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.IdUnidade == idUnidade, ct)
                ?? throw new InvalidOperationException("Unidade inexistente.");
            if (entity.IdCondominio is uint idCondo && unidade.IdCondominio != idCondo)
                throw new InvalidOperationException("A unidade não pertence ao condomínio informado.");
            entity.IdCondominio ??= unidade.IdCondominio;
        }

        if (_tenant.IdCondominio is uint tenantId)
            entity.IdCondominio ??= tenantId;

        if (entity.IdCondominio is null or 0)
            throw new InvalidOperationException("IdCondominio é obrigatório.");

        if (entity.DataFim is DateOnly fim && entity.DataInicio > fim)
            throw new InvalidOperationException("Data fim não pode ser anterior à data início.");

        var pj = await _db.PessoaJuridica.IgnoreQueryFilters()
            .AnyAsync(p => p.IdPessoa == entity.IdPessoa, ct);
        if (pj && escopo == EscopoPapelVinculo.Unidade
            && entity.CodigoPapelVinculo is not (PapelVinculoCodigos.Proprietario or PapelVinculoCodigos.Locatario or PapelVinculoCodigos.Corretor))
            throw new InvalidOperationException("Pessoa jurídica só pode ter papéis Proprietário, Locatário ou Corretor na unidade.");

        await ValidarSobreposicaoAsync(entity, inclusao, ct);
    }

    public async Task AplicarAjustesAposGravarAsync(PessoaVinculo entity, CancellationToken ct = default)
    {
        if (entity.Responsavel == 1 && entity.IdUnidade is uint idUnidade && PessoaVinculoAtivo.EstaAtivo(entity.DataInicio, entity.DataFim))
        {
            var outros = await _db.PessoaVinculo.IgnoreQueryFilters()
                .Where(v => v.IdUnidade == idUnidade && v.IdVinculo != entity.IdVinculo
                    && v.Responsavel == 1
                    && v.DataFim == null)
                .ToListAsync(ct);
            foreach (var v in outros)
                v.Responsavel = 0;
            await _db.SaveChangesAsync(ct);
        }

        if (entity.CodigoPapelVinculo == PapelVinculoCodigos.RepresentanteLegal
            && entity.IdPessoaRelacionada is uint idPf
            && entity.IdPessoa is uint idPj)
        {
            var pj = await _db.PessoaJuridica.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.IdPessoa == idPj, ct);
            if (pj is not null && pj.IdResponsavel is null)
            {
                pj.IdResponsavel = idPf;
                await _db.SaveChangesAsync(ct);
            }
        }
    }

    private async Task ValidarSobreposicaoAsync(PessoaVinculo entity, bool inclusao, CancellationToken ct)
    {
        var inicio = entity.DataInicio!.Value;
        var fim = entity.DataFim;
        var query = _db.PessoaVinculo.IgnoreQueryFilters()
            .Where(v => v.IdPessoa == entity.IdPessoa
                && v.IdCondominio == entity.IdCondominio
                && v.CodigoPapelVinculo == entity.CodigoPapelVinculo
                && v.IdUnidade == entity.IdUnidade
                && v.IdPessoaRelacionada == entity.IdPessoaRelacionada);

        if (!inclusao && entity.IdVinculo is uint id)
            query = query.Where(v => v.IdVinculo != id);

        var conflitos = await query.ToListAsync(ct);
        foreach (var v in conflitos)
        {
            var fimExistente = v.DataFim;
            var sobrepoe = PeriodosSobrepoem(inicio, fim, v.DataInicio!.Value, fimExistente);
            if (sobrepoe)
                throw new InvalidOperationException(
                    "Já existe vínculo ativo ou sobreposto para esta pessoa, papel, unidade e condomínio.");
        }
    }

    private static bool PeriodosSobrepoem(DateOnly aInicio, DateOnly? aFim, DateOnly bInicio, DateOnly? bFim)
    {
        var aFimEfetivo = aFim ?? DateOnly.MaxValue;
        var bFimEfetivo = bFim ?? DateOnly.MaxValue;
        return aInicio <= bFimEfetivo && bInicio <= aFimEfetivo;
    }
}