using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Domain.Vinculos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AppCondominium.Infrastructure.Persistence;

/// <summary>
/// Condomínio mínimo (se necessário) e usuário Administrador inicial.
/// E-mail e senha só são criados quando não existe nenhum registro em <c>Pessoafisica</c>.
/// </summary>
public static class AdminBootstrapSeeder
{
    private const string DefaultEmail = "admin@condominium.local";
    private const string DefaultPassword = "Admin@123456";
    private const string DefaultCondominioNome = "Condomínio Sistema";
    public const string AdminCpfPlaceholder = "00000000191";

    public static async Task SeedAsync(
        AppDbContext db,
        IPasswordHasher hasher,
        IConfiguration config,
        bool isDevelopment,
        ILogger logger,
        CancellationToken ct = default)
    {
        if (!config.GetValue("Bootstrap:Enabled", isDevelopment))
            return;

        var email = (config["Bootstrap:AdminEmail"] ?? DefaultEmail).Trim().ToLowerInvariant();
        var password = config["Bootstrap:AdminPassword"];
        if (string.IsNullOrWhiteSpace(password))
        {
            if (!isDevelopment)
            {
                logger.LogWarning(
                    "Bootstrap:AdminPassword não configurado; usuário admin não será criado fora de Development.");
                return;
            }
            password = DefaultPassword;
        }

        var perfilAdmin = await db.PerfilAcesso.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Descricao != null && p.Descricao.ToLower() == "administrador", ct);
        if (perfilAdmin?.IdPerfil == null)
        {
            logger.LogWarning("Perfil Administrador não encontrado. Execute database/schema.sql antes do bootstrap.");
            return;
        }

        var condominio = await db.Condominio.IgnoreQueryFilters().OrderBy(c => c.IdCondominio).FirstOrDefaultAsync(ct);
        if (condominio?.IdCondominio == null)
        {
            condominio = await CriarCondominioMinimoAsync(db, ct);
            logger.LogInformation("Condomínio bootstrap criado: Id={Id}, Nome={Nome}", condominio.IdCondominio, condominio.Nome);
        }

        if (await db.Pessoafisica.IgnoreQueryFilters().AnyAsync(ct))
        {
            logger.LogInformation(
                "Bootstrap: já existem usuários cadastrados; e-mail e senha do administrador não são alterados.");
            return;
        }

        var idCondominio = condominio.IdCondominio!.Value;
        var hash = hasher.Hash(password);

        var pessoaExistente = await db.Pessoa.IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.CPFCNPJ == AdminCpfPlaceholder, ct);

        uint idPessoa;
        if (pessoaExistente?.IdPessoa == null)
        {
            var pessoa = new Pessoa
            {
                CPFCNPJ = AdminCpfPlaceholder,
                Nome = "Administrador do Sistema",
                Telefone = null
            };
            db.Pessoa.Add(pessoa);
            await db.SaveChangesAsync(ct);
            idPessoa = pessoa.IdPessoa!.Value;
            logger.LogInformation("Pessoa admin criada: IdPessoa={IdPessoa}", idPessoa);
        }
        else
        {
            idPessoa = pessoaExistente.IdPessoa.Value;
            logger.LogInformation(
                "Pessoa com CPF bootstrap já existe; reutilizando IdPessoa={IdPessoa}.",
                idPessoa);
        }

        var pf = new Pessoafisica
        {
            IdPessoa = idPessoa,
            Email = email,
            Senha = hash,
            DataNascimento = new DateOnly(1990, 1, 1)
        };
        db.Pessoafisica.Add(pf);
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Usuário admin criado: {Email}, IdPessoa={IdPessoa}", email, idPessoa);

        var hoje = PessoaVinculoAtivo.HojeUtc();
        var vinculo = await db.PessoaVinculo.IgnoreQueryFilters()
            .FirstOrDefaultAsync(v => v.IdPessoa == idPessoa && v.IdCondominio == idCondominio
                && v.DataInicio <= hoje && (v.DataFim == null || v.DataFim >= hoje), ct);
        if (vinculo == null)
        {
            db.PessoaVinculo.Add(new PessoaVinculo
            {
                IdPessoa = idPessoa,
                IdCondominio = idCondominio,
                CodigoPapelVinculo = PapelVinculoCodigos.Funcionario,
                IdPerfil = perfilAdmin.IdPerfil,
                DataInicio = hoje,
                Responsavel = 0,
                DataFim = null
            });
            await db.SaveChangesAsync(ct);
            logger.LogInformation(
                "Vínculo PessoaVinculo admin: IdPessoa={IdPessoa}, IdCondominio={IdCondominio}, Perfil=Administrador",
                idPessoa, idCondominio);
        }
        else if (vinculo.IdPerfil != perfilAdmin.IdPerfil)
        {
            vinculo.IdPerfil = perfilAdmin.IdPerfil;
            db.PessoaVinculo.Update(vinculo);
            await db.SaveChangesAsync(ct);
        }
    }

    private static async Task<Condominio> CriarCondominioMinimoAsync(AppDbContext db, CancellationToken ct)
    {
        if (!await db.UF.AnyAsync(u => u.SiglaUF == "SP", ct))
        {
            db.UF.Add(new UF { SiglaUF = "SP", Estado = "São Paulo", CodigoIBGE = 35 });
        }

        const uint codigoMunicipio = 3550308;
        if (!await db.Municipio.AnyAsync(m => m.CodigoIBGEMunicipio == codigoMunicipio, ct))
        {
            db.Municipio.Add(new Municipio
            {
                CodigoIBGEMunicipio = codigoMunicipio,
                Nome = "São Paulo",
                SiglaUF = "SP"
            });
        }

        var bairro = await db.Bairro.FirstOrDefaultAsync(b => b.Nome == "Centro", ct);
        if (bairro == null)
        {
            bairro = new Bairro
            {
                Nome = "Centro",
                CodigoIBGEMunicipio = codigoMunicipio
            };
            db.Bairro.Add(bairro);
            await db.SaveChangesAsync(ct);
        }

        var endereco = new Endereco
        {
            CEP = "01001000",
            Logradouro = "Praça da Sé",
            IdBairro = bairro.IdBairro
        };
        db.Endereco.Add(endereco);
        await db.SaveChangesAsync(ct);

        var condominio = new Condominio
        {
            Nome = DefaultCondominioNome,
            IdEndereco = endereco.IdEndereco,
            NumeroEndereco = 1,
            AreaTerreno = 1000,
            AreaTotalEdificada = 500,
            Dominio = "sistema.local",
            Ativo = 1,
            CNPJ = null
        };
        db.Condominio.Add(condominio);
        await db.SaveChangesAsync(ct);
        return condominio;
    }
}
