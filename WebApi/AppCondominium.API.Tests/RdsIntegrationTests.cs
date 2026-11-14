using AppCondominium.Application.DTOs;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Vinculos;
using AppCondominium.Infrastructure;
using AppCondominium.Infrastructure.Persistence;
using AppCondominium.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace AppCondominium.API.Tests;

/// <summary>Testes reais no RDS dev (túnel SSH via user-secrets). Defina APP_INTEGRATION_RDS=1 para executar.</summary>
[Trait("Category", "RdsIntegration")]
public class RdsIntegrationTests
{
    private static bool Habilitado =>
        string.Equals(Environment.GetEnvironmentVariable("APP_INTEGRATION_RDS"), "1", StringComparison.Ordinal);

    private static IServiceProvider CriarServicos()
    {
        var apiDir = EncontrarApiDir();
        var config = new ConfigurationBuilder()
            .AddJsonFile(Path.Combine(apiDir, "appsettings.json"))
            .AddJsonFile(Path.Combine(apiDir, "appsettings.Development.json"), optional: true)
            .AddJsonFile(CaminhoUserSecrets(), optional: true)
            .AddEnvironmentVariables()
            .Build();

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddInfrastructure(config);
        return services.BuildServiceProvider(validateScopes: true);
    }

    [Fact]
    public async Task Rds_fornecedor_pf_em_dois_condominios_e_limpa_dados()
    {
        if (!Habilitado)
        {
            Assert.True(true, "Ignorado: defina APP_INTEGRATION_RDS=1 para testes no RDS.");
            return;
        }

        var root = CriarServicos();
        await using var scope = root.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenant = scope.ServiceProvider.GetRequiredService<ICondominioContext>();
        var fornecedor = scope.ServiceProvider.GetRequiredService<IFornecedorCadastroService>();

        var condominios = await db.Condominio.IgnoreQueryFilters().AsNoTracking()
            .OrderBy(c => c.IdCondominio).Take(2).ToListAsync();
        Assert.NotEmpty(condominios);

        var cpf = $"9{DateTime.UtcNow:yyMMddHHmmss}".PadRight(11, '0')[..11];
        var c1 = condominios[0].IdCondominio!.Value;
        await LimparFornecedorTesteAsync(db, 0, cpf, c1, null);
        tenant.SetCondominio(c1);

        var a = await fornecedor.CadastrarAsync(new FornecedorIntegradoRequest
        {
            CPFCNPJ = cpf,
            Nome = "Teste Integração Fornecedor PF",
            DataNascimento = new DateOnly(1988, 3, 3),
            Ativo = true,
            CriarPapelVinculo = true
        });

        uint? c2 = null;
        FornecedorIntegradoResponse? b = null;
        if (condominios.Count > 1)
        {
            c2 = condominios[1].IdCondominio!.Value;
            tenant.SetCondominio(c2.Value);
            b = await fornecedor.CadastrarAsync(new FornecedorIntegradoRequest
            {
                CPFCNPJ = cpf,
                Nome = "Teste Integração Fornecedor PF",
                Telefone = "11988887777",
                DataNascimento = new DateOnly(1988, 3, 3)
            });
            Assert.Equal(a.IdPessoa, b.IdPessoa);
            Assert.NotEqual(a.IdFornecedor, b.IdFornecedor);
        }

        await LimparFornecedorTesteAsync(db, a.IdPessoa, cpf, c1, c2);
    }

    private static async Task LimparFornecedorTesteAsync(AppDbContext db, uint idPessoa, string cpf, uint c1, uint? c2)
    {
        if (idPessoa == 0)
        {
            var existente = await db.Pessoa.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.CPFCNPJ == cpf);
            idPessoa = existente?.IdPessoa ?? 0;
            if (idPessoa == 0) return;
        }

        var vinculos = await db.PessoaVinculo.IgnoreQueryFilters()
            .Where(v => v.IdPessoa == idPessoa && v.CodigoPapelVinculo == PapelVinculoCodigos.Fornecedor
                && (v.IdCondominio == c1 || (c2 != null && v.IdCondominio == c2)))
            .ToListAsync();
        db.PessoaVinculo.RemoveRange(vinculos);
        await db.SaveChangesAsync();

        var fornecedores = await db.Fornecedor.IgnoreQueryFilters()
            .Where(f => f.IdPessoa == idPessoa && (f.IdCondominio == c1 || (c2 != null && f.IdCondominio == c2)))
            .ToListAsync();
        db.Fornecedor.RemoveRange(fornecedores);
        await db.SaveChangesAsync();

        var pf = await db.Pessoafisica.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.IdPessoa == idPessoa);
        if (pf is not null)
        {
            db.Pessoafisica.Remove(pf);
            await db.SaveChangesAsync();
        }

        var pessoa = await db.Pessoa.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.CPFCNPJ == cpf);
        if (pessoa is not null)
        {
            db.Pessoa.Remove(pessoa);
            await db.SaveChangesAsync();
        }
    }

    private static string CaminhoUserSecrets() =>
        Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "Microsoft", "UserSecrets", "app-condominium-api-2026", "secrets.json");

    private static string EncontrarApiDir()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null)
        {
            var candidato = Path.Combine(dir.FullName, "WebApi", "AppCondominium.API");
            if (File.Exists(Path.Combine(candidato, "appsettings.json")))
                return candidato;
            dir = dir.Parent;
        }

        throw new InvalidOperationException("AppCondominium.API não encontrado.");
    }
}