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
    public DbSet<PessoaUnidade> PessoaUnidade { get; set; } = null!;
    public DbSet<PerfilAcesso> PerfilAcesso { get; set; } = null!;
    public DbSet<PermissionKey> PermissionKey { get; set; } = null!;
    public DbSet<PerfilPermissao> PerfilPermissao { get; set; } = null!;
    public DbSet<PessoaPermissaoExcecao> PessoaPermissaoExcecao { get; set; } = null!;

    partial void ConfigureEntityKeys(ModelBuilder modelBuilder);
    partial void ConfigureTenantQueryFilters(ModelBuilder modelBuilder);

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Pessoa>().HasKey(p => p.IdPessoa);
        modelBuilder.Entity<PessoaUnidade>().HasKey(p => new { p.IdPessoa, p.IdUnidade });
        modelBuilder.Entity<Pessoa>().HasQueryFilter(p =>
            Set<PessoaCondominio>().Any(v => v.IdPessoa == p.IdPessoa && v.IdCondominio == CurrentTenantId)
            || Set<Fornecedor>().Any(f => f.IdPessoa == p.IdPessoa && f.IdCondominio == CurrentTenantId)
            || Set<Unidade>().Any(u => Set<PessoaUnidade>().Any(pu => pu.IdUnidade == u.IdUnidade && pu.IdPessoa == p.IdPessoa) && u.IdCondominio == CurrentTenantId));
        modelBuilder.Entity<PessoaUnidade>().HasQueryFilter(pu =>
            Set<Unidade>().Any(u => u.IdUnidade == pu.IdUnidade && u.IdCondominio == CurrentTenantId));

        modelBuilder.Entity<Pessoafisica>().ToTable("pessoafisica");
        modelBuilder.Entity<Pessoafisica>().Property(p => p.Email).HasColumnName("email");

        modelBuilder.Entity<PerfilAcesso>().HasKey(p => p.IdPerfil);
        modelBuilder.Entity<PermissionKey>().HasKey(p => p.IdPermissionKey);
        modelBuilder.Entity<PermissionKey>().HasIndex(p => p.Chave).IsUnique();
        modelBuilder.Entity<PerfilPermissao>().HasKey(p => new { p.IdPerfil, p.IdPermissionKey });
        modelBuilder.Entity<PessoaPermissaoExcecao>().HasKey(p => new { p.IdPessoa, p.IdCondominio, p.IdPermissionKey });
        modelBuilder.Entity<PessoaPermissaoExcecao>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);

        modelBuilder.Entity<Banco>(b =>
        {
            b.Property(e => e.IdBanco).ValueGeneratedOnAdd();
            b.Property(e => e.CodigoBanco).HasMaxLength(3);
            b.Property(e => e.DigitoVerificador).HasMaxLength(1);
            b.Property(e => e.Nome).HasMaxLength(255).IsRequired();
            b.Property(e => e.ISPB).HasMaxLength(8).IsRequired();
            b.Property(e => e.CNPJ).HasMaxLength(14);
            b.Property(e => e.Ativo).IsRequired();
            b.HasIndex(e => e.CodigoBanco).IsUnique().HasDatabaseName("uq_Banco_CodigoBanco");
            b.HasIndex(e => e.ISPB).IsUnique().HasDatabaseName("uq_Banco_ISPB");
        });

        ConfigureEntityKeys(modelBuilder);
        ConfigureTenantQueryFilters(modelBuilder);
        base.OnModelCreating(modelBuilder);
    }
}
