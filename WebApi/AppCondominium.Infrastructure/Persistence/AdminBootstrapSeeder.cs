using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AppCondominium.Infrastructure.Persistence;

/// <summary>
/// Condomínio mínimo + usuário Administrador (Pessoa / PessoaFísica / PessoaCondominio).
/// </summary>
public static class AdminBootstrapSeeder
{
    private const string DefaultEmail = "admin@condominium.local";
    private const string DefaultPassword = "Admin@123456";
    private const string DefaultCondominioNome = "Condomínio Sistema";

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

        var idCondominio = condominio.IdCondominio!.Value;
        var hash = hasher.Hash(password);

        var pf = await db.Pessoafisica.IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.Email != null && p.Email.ToLower() == email, ct);

        uint idPessoa;
        if (pf?.IdPessoa == null)
        {
            var pessoa = new Pessoa
            {
                CPFCNPJ = "00000000191",
                Nome = "Administrador do Sistema",
                Telefone = null
            };
            db.Pessoa.Add(pessoa);
            await db.SaveChangesAsync(ct);

            idPessoa = pessoa.IdPessoa!.Value;
            pf = new Pessoafisica
            {
                IdPessoa = idPessoa,
                Email = email,
                Senha = hash,
                DataNascimento = new DateOnly(1990, 1, 1)
            };
            db.Pessoafisica.Add(pf);
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Usuário admin criado: {Email}, IdPessoa={IdPessoa}", email, idPessoa);
        }
        else
        {
            idPessoa = pf.IdPessoa.Value;
            if (!hasher.Verify(password, pf.Senha ?? ""))
            {
                pf.Senha = hash;
                db.Pessoafisica.Update(pf);
                await db.SaveChangesAsync(ct);
                logger.LogInformation("Senha do admin atualizada (BCrypt): {Email}", email);
            }
        }

        var vinculo = await db.PessoaCondominio.IgnoreQueryFilters()
            .FirstOrDefaultAsync(v => v.IdPessoa == idPessoa && v.IdCondominio == idCondominio, ct);
        if (vinculo == null)
        {
            db.PessoaCondominio.Add(new PessoaCondominio
            {
                IdPessoa = idPessoa,
                IdCondominio = idCondominio,
                IdPerfil = perfilAdmin.IdPerfil,
                DataInicio = DateOnly.FromDateTime(DateTime.UtcNow),
                TipoVinculo = 1,
                DataFim = null
            });
            await db.SaveChangesAsync(ct);
            logger.LogInformation(
                "Vínculo PessoaCondominio admin: IdPessoa={IdPessoa}, IdCondominio={IdCondominio}, Perfil=Administrador",
                idPessoa, idCondominio);
        }
        else if (vinculo.IdPerfil != perfilAdmin.IdPerfil)
        {
            vinculo.IdPerfil = perfilAdmin.IdPerfil;
            db.PessoaCondominio.Update(vinculo);
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
