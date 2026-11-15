using AppCondominium.Application.Convites;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Convites;
using AppCondominium.Domain.Entities;
using AppCondominium.Domain.Vinculos;
using AppCondominium.Infrastructure.Persistence;
using AppCondominium.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

namespace AppCondominium.API.Tests;

public class ConviteAcessoTests
{
    [Fact]
    public async Task Conta_nova_aceita_cria_pessoa_vinculo_e_consome_convite()
    {
        await using var db = await SeedBaseAsync();
        var tenant = new TenantMutavel(1);
        var svc = CreateService(db, tenant, emailOk: true);

        tenant.SetCondominio(1);
        var emitido = await svc.EmitirAsync(10, new EmitirConviteRequest(
            "novo@example.com", "52998224725", PapelVinculoCodigos.Morador, 2, 100, null, null, null));

        var token = FakeEmailSender.UltimoToken ?? throw new InvalidOperationException("Token ausente.");
        var val = await svc.ValidarTokenAsync(token);
        Assert.True(val.Valido);
        Assert.True(val.RequerDefinirSenha);

        var aceite = await svc.AceitarContaNovaAsync(new AceitarConviteContaNovaRequest(
            token, "Novo Morador", "52998224725", "novo@example.com",
            new DateOnly(1990, 5, 5), "SenhaForte1!", null));

        Assert.True(aceite.Sucesso);
        var convite = await db.ConviteAcesso.IgnoreQueryFilters().FirstAsync(c => c.IdConvite == emitido.IdConvite);
        Assert.Equal(ConviteAcessoEstado.Aceito, convite.Estado);
        Assert.NotNull(convite.IdVinculoCriado);
    }

    [Fact]
    public async Task Conta_existente_aceita_novo_condominio_sem_alterar_senha()
    {
        await using var db = await SeedBaseAsync();
        db.Pessoafisica.Add(new Pessoafisica
        {
            IdPessoa = 30,
            Email = "existente@example.com",
            Senha = "$2a$10$abcdefghijklmnopqrstuv"
        });
        db.Pessoa.Add(new Pessoa { IdPessoa = 30, CPFCNPJ = "39053344705", Nome = "Existente" });
        await db.SaveChangesAsync();

        var tenant = new TenantMutavel(1);
        var svc = CreateService(db, tenant, emailOk: true);
        tenant.SetCondominio(1);

        var emitido = await svc.EmitirAsync(10, new EmitirConviteRequest(
            "existente@example.com", "39053344705", PapelVinculoCodigos.Morador, 2, 100, null, 30, null));

        var token = FakeEmailSender.UltimoToken ?? throw new InvalidOperationException("Token ausente.");
        var val = await svc.ValidarTokenAsync(token);
        Assert.True(val.RequerAutenticacao);

        var resp = await svc.AceitarAutenticadoAsync(30, new AceitarConviteAutenticadoRequest(token));
        Assert.True(resp.Sucesso);

        var senhaAntes = (await db.Pessoafisica.IgnoreQueryFilters().FirstAsync(p => p.IdPessoa == 30)).Senha;
        Assert.Equal("$2a$10$abcdefghijklmnopqrstuv", senhaAntes);
    }

    [Fact]
    public async Task Convite_expirado_e_revogado_retornam_mensagem_segura()
    {
        await using var db = await SeedBaseAsync();
        var svc = CreateService(db, new TenantMutavel(1), emailOk: true);

        db.ConviteAcesso.Add(new ConviteAcesso
        {
            IdConvite = 50,
            IdCondominio = 1,
            EmailDestinatario = "x@example.com",
            TipoConvite = ConviteTipoConvite.AtivacaoContaNova,
            CodigoPapelVinculo = PapelVinculoCodigos.Morador,
            TokenHash = ConviteTokenUtil.HashToken("expirado"),
            DataEmissao = DateTime.UtcNow.AddDays(-5),
            DataExpiracao = DateTime.UtcNow.AddDays(-1),
            Estado = ConviteAcessoEstado.Pendente,
            IdPessoaEmissor = 10,
            EstadoEnvioEmail = ConviteEnvioEmailEstado.Enviado,
            TentativasEnvioEmail = 1
        });
        await db.SaveChangesAsync();

        var val = await svc.ValidarTokenAsync("expirado");
        Assert.False(val.Valido);
        Assert.Equal("expirado", val.Codigo);
    }

    [Fact]
    public async Task Reenvio_altera_hash_e_revogacao_bloqueia_aceite()
    {
        await using var db = await SeedBaseAsync();
        var tenant = new TenantMutavel(1);
        var svc = CreateService(db, tenant, emailOk: true);
        tenant.SetCondominio(1);

        var emitido = await svc.EmitirAsync(10, new EmitirConviteRequest(
            "reenvio@example.com", null, PapelVinculoCodigos.Morador, 2, 100, null, null, null));
        var hashAntes = (await db.ConviteAcesso.IgnoreQueryFilters()
            .FirstAsync(c => c.IdConvite == emitido.IdConvite)).TokenHash;

        await svc.ReenviarAsync(emitido.IdConvite, 10);
        var hashDepois = (await db.ConviteAcesso.IgnoreQueryFilters()
            .FirstAsync(c => c.IdConvite == emitido.IdConvite)).TokenHash;
        Assert.NotEqual(hashAntes, hashDepois);

        await svc.RevogarAsync(emitido.IdConvite, 10);
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            svc.AceitarContaNovaAsync(new AceitarConviteContaNovaRequest(
                "qualquer", "A", "52998224725", "reenvio@example.com",
                new DateOnly(1990, 1, 1), "SenhaForte1!", null)));
    }

  private static IConviteAcessoService CreateService(AppDbContext db, ICondominioContext tenant, bool emailOk)
    {
        return new ConviteAcessoService(
            db,
            tenant,
            new PessoaVinculoService(db, tenant),
            new PessoaCadastroService(db),
            new PermissionResolver(db),
            new FakeEmailSender(emailOk),
            Options.Create(new ConviteOptions { ValidadeHoras = 48, AceiteBaseUrl = "https://test/convite/aceitar" }),
            NullLogger<ConviteAcessoService>.Instance);
    }

    private static async Task<AppDbContext> SeedBaseAsync()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        var db = new AppDbContext(options, new TenantMutavel());
        db.PerfilAcesso.AddRange(
            new PerfilAcesso { IdPerfil = 1, Descricao = "Administrador" },
            new PerfilAcesso { IdPerfil = 2, Descricao = "Morador" });
        db.Condominio.Add(new Condominio { IdCondominio = 1, Nome = "Alpha", Dominio = "alpha" });
        db.Unidade.Add(new Unidade { IdUnidade = 100, IdCondominio = 1 });
        db.Pessoa.Add(new Pessoa { IdPessoa = 10, CPFCNPJ = "11144477735", Nome = "Admin" });
        db.Pessoafisica.Add(new Pessoafisica { IdPessoa = 10, Email = "admin@example.com", Senha = "hash" });
        db.PessoaVinculo.Add(new PessoaVinculo
        {
            IdPessoa = 10,
            IdCondominio = 1,
            CodigoPapelVinculo = PapelVinculoCodigos.Funcionario,
            IdPerfil = 1,
            DataInicio = PessoaVinculoAtivo.HojeUtc(),
            Responsavel = 0
        });
        db.PapelVinculo.Add(new PapelVinculo { CodigoPapelVinculo = PapelVinculoCodigos.Morador, Descricao = "Morador", EscopoPapel = EscopoPapelVinculo.Unidade });
        db.PapelVinculo.Add(new PapelVinculo { CodigoPapelVinculo = PapelVinculoCodigos.Funcionario, Descricao = "Func", EscopoPapel = EscopoPapelVinculo.Condominio });
        db.PermissionKey.Add(new PermissionKey { IdPermissionKey = 900, Chave = "CONVITEACESSO", Nome = "Convites", Modulo = "Pessoas" });
        db.PerfilPermissao.Add(new PerfilPermissao
        {
            IdPerfil = 1,
            IdPermissionKey = 900,
            Visualizar = true,
            Incluir = true,
            Alterar = true
        });
        await db.SaveChangesAsync();
        return db;
    }

    private sealed class TenantMutavel : ICondominioContext
    {
        public TenantMutavel(uint? id = null) => IdCondominio = id;
        public uint? IdCondominio { get; private set; }
        public void SetCondominio(uint idCondominio) => IdCondominio = idCondominio;
        public void Clear() => IdCondominio = null;
        public uint RequireTenantId() => IdCondominio ?? throw new InvalidOperationException("Sem tenant.");
    }

    private sealed class FakeEmailSender : IEmailSender
    {
        public static string? UltimoToken;
        private readonly bool _ok;
        public FakeEmailSender(bool ok) => _ok = ok;

        public Task<long> EnviarAsync(EmailMessage mensagem, CancellationToken ct = default)
        {
            if (!_ok) throw new InvalidOperationException("SMTP indisponível");
            var idx = mensagem.CorpoHtml.IndexOf("token=", StringComparison.Ordinal);
            if (idx >= 0)
            {
                var sub = mensagem.CorpoHtml[(idx + 6)..];
                var end = sub.IndexOf('"');
                UltimoToken = Uri.UnescapeDataString(sub[..end]);
            }
            return Task.FromResult(1L);
        }
    }
}