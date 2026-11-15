using AppCondominium.Application.Interfaces;
using AppCondominium.Domain;
using AppCondominium.Domain.Entities;
using AppCondominium.Domain.Validators;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.Infrastructure.Services;

public class UsuarioIdentificacaoService : IUsuarioIdentificacaoService
{
    private readonly AppDbContext _db;

    public UsuarioIdentificacaoService(AppDbContext db) => _db = db;

    public async Task<Pessoafisica?> ResolverPessoafisicaPorUsuarioAsync(string usuario, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(usuario))
            return null;

        var trimmed = usuario.Trim();
        if (UsuarioIdentificador.PareceEmail(trimmed))
        {
            var email = trimmed.ToLowerInvariant();
            return await _db.Pessoafisica.IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.Email != null && p.Email.ToLower() == email, ct);
        }

        var cpf = UsuarioIdentificador.NormalizarCpfOuNull(trimmed);
        if (cpf == null || !DocumentoValidator.ValidarCpf(trimmed))
            return null;

        var idPessoa = await _db.Pessoa.IgnoreQueryFilters()
            .AsNoTracking()
            .Where(p => p.CPFCNPJ == cpf)
            .Select(p => p.IdPessoa)
            .FirstOrDefaultAsync(ct);

        if (idPessoa == null)
            return null;

        return await _db.Pessoafisica.IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.IdPessoa == idPessoa, ct);
    }

    public async Task<uint?> ResolverIdPessoaPorUsuarioAsync(string usuario, CancellationToken ct = default)
    {
        var pf = await ResolverPessoafisicaPorUsuarioAsync(usuario, ct);
        return pf?.IdPessoa;
    }
}