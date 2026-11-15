using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.Infrastructure.Persistence;

public partial class AppDbContext
{
    private readonly ICondominioContext? _tenantContext;

    /// <summary>Tenant ativo usado pelos global query filters. 0 = nenhum registro de tenant.</summary>
    public uint CurrentTenantId => _tenantContext?.IdCondominio ?? 0;

    public AppDbContext(DbContextOptions<AppDbContext> options, ICondominioContext tenantContext) : base(options)
    {
        _tenantContext = tenantContext;
    }

    public DbSet<Pessoa> Pessoa { get; set; } = null!;
    public DbSet<PerfilAcesso> PerfilAcesso { get; set; } = null!;
    public DbSet<PermissionKey> PermissionKey { get; set; } = null!;
    public DbSet<PerfilPermissao> PerfilPermissao { get; set; } = null!;
    public DbSet<PessoaPermissaoExcecao> PessoaPermissaoExcecao { get; set; } = null!;
    public DbSet<PessoaEndereco> PessoaEndereco { get; set; } = null!;
    public DbSet<ConviteAcesso> ConviteAcesso { get; set; } = null!;
    public DbSet<ConfiguracaoEmail> ConfiguracoesEmail { get; set; } = null!;
    public DbSet<EmailQueue> EmailQueues { get; set; } = null!;
    public DbSet<RecuperacaoSenhaToken> RecuperacaoSenhaToken { get; set; } = null!;

    partial void ConfigureEntityKeys(ModelBuilder modelBuilder);
    partial void ConfigureTenantQueryFilters(ModelBuilder modelBuilder);

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Pessoa>().HasKey(p => p.IdPessoa);
        modelBuilder.Entity<Pessoa>().HasQueryFilter(p =>
            Set<PessoaVinculo>().Any(v => v.IdPessoa == p.IdPessoa && v.IdCondominio == CurrentTenantId
                && v.DataInicio <= DateOnly.FromDateTime(DateTime.UtcNow)
                && (v.DataFim == null || v.DataFim >= DateOnly.FromDateTime(DateTime.UtcNow)))
            || Set<Fornecedor>().Any(f => f.IdPessoa == p.IdPessoa && f.IdCondominio == CurrentTenantId));

        modelBuilder.Entity<Pessoafisica>().ToTable("pessoafisica");
        modelBuilder.Entity<Pessoafisica>().Property(p => p.Email).HasColumnName("email");

        modelBuilder.Entity<PessoaEndereco>().ToTable("PessoaEndereco");
        modelBuilder.Entity<PessoaEndereco>().HasKey(pe => new { pe.IdPessoa, pe.IdEndereco });
        modelBuilder.Entity<PessoaEndereco>().HasQueryFilter(pe =>
            Set<PessoaVinculo>().Any(v => v.IdPessoa == pe.IdPessoa
                && v.IdCondominio == CurrentTenantId
                && v.DataInicio <= DateOnly.FromDateTime(DateTime.UtcNow)
                && (v.DataFim == null || v.DataFim >= DateOnly.FromDateTime(DateTime.UtcNow)))
            || Set<Fornecedor>().Any(f => f.IdPessoa == pe.IdPessoa && f.IdCondominio == CurrentTenantId));

        modelBuilder.Entity<PerfilAcesso>().HasKey(p => p.IdPerfil);
        modelBuilder.Entity<PermissionKey>().HasKey(p => p.IdPermissionKey);
        modelBuilder.Entity<PermissionKey>().HasIndex(p => p.Chave).IsUnique();
        modelBuilder.Entity<PerfilPermissao>().HasKey(p => new { p.IdPerfil, p.IdPermissionKey });
        modelBuilder.Entity<PessoaPermissaoExcecao>().HasKey(p => new { p.IdPessoa, p.IdCondominio, p.IdPermissionKey });
        modelBuilder.Entity<PessoaPermissaoExcecao>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);

        modelBuilder.Entity<ConviteAcesso>().HasKey(c => c.IdConvite);
        modelBuilder.Entity<ConviteAcesso>().HasQueryFilter(c => c.IdCondominio == CurrentTenantId);
        modelBuilder.Entity<ConviteAcesso>().Property(c => c.TokenHash).HasMaxLength(64);
        modelBuilder.Entity<ConviteAcesso>().Property(c => c.EmailDestinatario).HasMaxLength(255);

        modelBuilder.Entity<ConfiguracaoEmail>().ToTable("configuracaoemail");
        modelBuilder.Entity<ConfiguracaoEmail>().HasKey(e => e.Id);
        modelBuilder.Entity<ConfiguracaoEmail>().Property(e => e.Provedor).HasMaxLength(40);
        modelBuilder.Entity<ConfiguracaoEmail>().Property(e => e.ServidorSmtp).HasMaxLength(255);
        modelBuilder.Entity<ConfiguracaoEmail>().Property(e => e.UsuarioSmtp).HasMaxLength(255);
        modelBuilder.Entity<ConfiguracaoEmail>().Property(e => e.SenhaCriptografada).HasMaxLength(2000);
        modelBuilder.Entity<ConfiguracaoEmail>().Property(e => e.NomeRemetente).HasMaxLength(200);
        modelBuilder.Entity<ConfiguracaoEmail>().Property(e => e.EmailRemetente).HasMaxLength(255);
        modelBuilder.Entity<ConfiguracaoEmail>().Property(e => e.ReplyTo).HasMaxLength(255);
        modelBuilder.Entity<ConfiguracaoEmail>().HasIndex(e => e.Ativo).HasDatabaseName("IX_configuracaoemail_Ativo");

        modelBuilder.Entity<EmailQueue>().ToTable("emailqueue");
        modelBuilder.Entity<EmailQueue>().HasKey(e => e.Id);
        modelBuilder.Entity<EmailQueue>().Property(e => e.Destinatario).HasMaxLength(255);
        modelBuilder.Entity<EmailQueue>().Property(e => e.Assunto).HasMaxLength(500);
        modelBuilder.Entity<EmailQueue>().Property(e => e.Status).HasMaxLength(20);
        modelBuilder.Entity<EmailQueue>().Property(e => e.MensagemErro).HasMaxLength(2000);
        modelBuilder.Entity<EmailQueue>().HasIndex(e => new { e.Status, e.DataCriacao }).HasDatabaseName("IX_emailqueue_Status_DataCriacao");

        modelBuilder.Entity<RecuperacaoSenhaToken>().ToTable("RecuperacaoSenhaToken");
        modelBuilder.Entity<RecuperacaoSenhaToken>().HasKey(t => t.IdRecuperacaoSenha);
        modelBuilder.Entity<RecuperacaoSenhaToken>().Property(t => t.TokenHash).HasMaxLength(64);
        modelBuilder.Entity<RecuperacaoSenhaToken>().Property(t => t.EmailNormalizado).HasMaxLength(255);
        modelBuilder.Entity<RecuperacaoSenhaToken>().HasIndex(t => t.TokenHash).IsUnique();
        modelBuilder.Entity<RecuperacaoSenhaToken>().HasIndex(t => new { t.IdPessoa, t.Estado });

        ConfigureEntityKeys(modelBuilder);
        ConfigureTenantQueryFilters(modelBuilder);

        modelBuilder.Entity<Unidade>()
            .Property(u => u.IdUnidade)
            .ValueGeneratedOnAdd();

        // IdCondominio é a própria chave do tenant, gerada na inclusão. Não reutilizar o tenant da sessão.
        modelBuilder.Entity<Condominio>()
            .Property(c => c.IdCondominio)
            .ValueGeneratedOnAdd();

        base.OnModelCreating(modelBuilder);
    }
}
