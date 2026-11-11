using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace AppCondominium.Infrastructure.Persistence;

/// <summary>Grava senhas de pessoa física sempre como hash BCrypt.</summary>
public sealed class PessoafisicaSenhaInterceptor : SaveChangesInterceptor
{
    private readonly IPasswordHasher _hasher;

    public PessoafisicaSenhaInterceptor(IPasswordHasher hasher) => _hasher = hasher;

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        NormalizeSenhas(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        NormalizeSenhas(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void NormalizeSenhas(DbContext? context)
    {
        if (context == null)
            return;

        foreach (var entry in context.ChangeTracker.Entries<Pessoafisica>())
        {
            if (entry.State is not (EntityState.Added or EntityState.Modified))
                continue;
            var senha = entry.Entity.Senha;
            if (string.IsNullOrWhiteSpace(senha))
                continue;
            if (senha.StartsWith("$2", StringComparison.Ordinal))
                continue;
            entry.Entity.Senha = _hasher.Hash(senha);
        }
    }
}
