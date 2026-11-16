using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace AppCondominium.Tools;

internal static class LoginDiagnose
{
    public static async Task<int> RunAsync(IServiceProvider services, CancellationToken ct)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var admins = await (
                from pf in db.Pessoafisica.IgnoreQueryFilters()
                join p in db.Pessoa.IgnoreQueryFilters() on pf.IdPessoa equals p.IdPessoa
                where p.CPFCNPJ == AdminBootstrapSeeder.AdminCpfPlaceholder
                       || (pf.Email != null && pf.Email.ToLower() == "admin@condominium.local")
                select new { p.IdPessoa, p.CPFCNPJ, p.Nome, pf.Email })
            .Take(5)
            .ToListAsync(ct);

        Console.WriteLine("Contas relacionadas ao bootstrap:");
        foreach (var a in admins)
            Console.WriteLine($"  IdPessoa={a.IdPessoa} CPF={a.CPFCNPJ} Nome={a.Nome} Email={a.Email}");

        var vinculos = await db.PessoaVinculo.IgnoreQueryFilters()
            .Where(v => v.DataFim == null || v.DataFim >= DateOnly.FromDateTime(DateTime.UtcNow))
            .OrderByDescending(v => v.IdVinculo)
            .Take(8)
            .Select(v => new { v.IdVinculo, v.IdPessoa, v.IdCondominio, v.IdPerfil })
            .ToListAsync(ct);
        Console.WriteLine("Vínculos ativos (amostra):");
        foreach (var v in vinculos)
            Console.WriteLine($"  IdVinculo={v.IdVinculo} IdPessoa={v.IdPessoa} IdCondominio={v.IdCondominio} IdPerfil={v.IdPerfil}");

        var contas = await (
                from pf in db.Pessoafisica.IgnoreQueryFilters()
                join p in db.Pessoa.IgnoreQueryFilters() on pf.IdPessoa equals p.IdPessoa
                orderby p.IdPessoa
                select new { p.IdPessoa, p.CPFCNPJ, p.Nome, pf.Email })
            .ToListAsync(ct);
        Console.WriteLine($"Total contas com login: {contas.Count}");
        foreach (var a in contas)
            Console.WriteLine($"  IdPessoa={a.IdPessoa} Email={a.Email} CPF={a.CPFCNPJ} Nome={a.Nome}");

        Console.WriteLine("Login bootstrap dev padrão: admin@condominium.local / Admin@123456");
        return 0;
    }
}