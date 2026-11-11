using Microsoft.EntityFrameworkCore;
using AppCondominium.Domain.Entities;

namespace AppCondominium.Infrastructure.Persistence;

public partial class AppDbContext
{
    partial void ConfigureTenantQueryFilters(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Condominio>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);
        modelBuilder.Entity<ConfiguracaoCondominio>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);
        modelBuilder.Entity<Bloco>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);
        modelBuilder.Entity<TipoUnidade>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);
        modelBuilder.Entity<Unidade>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);
        modelBuilder.Entity<Hidrometro>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);
        modelBuilder.Entity<ConsumoAgua>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);
        modelBuilder.Entity<Pessoafisica>().HasQueryFilter(e => Set<PessoaCondominio>().Any(v => v.IdPessoa == e.IdPessoa && v.IdCondominio == CurrentTenantId) || Set<Fornecedor>().Any(f => f.IdPessoa == e.IdPessoa && f.IdCondominio == CurrentTenantId) || Set<Unidade>().Any(u => Set<PessoaUnidade>().Any(pu => pu.IdUnidade == u.IdUnidade && pu.IdPessoa == e.IdPessoa) && u.IdCondominio == CurrentTenantId));
        modelBuilder.Entity<PessoaJuridica>().HasQueryFilter(e => Set<PessoaCondominio>().Any(v => v.IdPessoa == e.IdPessoa && v.IdCondominio == CurrentTenantId) || Set<Fornecedor>().Any(f => f.IdPessoa == e.IdPessoa && f.IdCondominio == CurrentTenantId) || Set<Unidade>().Any(u => Set<PessoaUnidade>().Any(pu => pu.IdUnidade == u.IdUnidade && pu.IdPessoa == e.IdPessoa) && u.IdCondominio == CurrentTenantId));
        modelBuilder.Entity<Fornecedor>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);
        modelBuilder.Entity<PessoaCondominio>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);
        modelBuilder.Entity<Equipamento>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);
        modelBuilder.Entity<AluguelEquipamento>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);
        modelBuilder.Entity<Concorrencia>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);
        modelBuilder.Entity<TipoDespesa>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);
        modelBuilder.Entity<Despesa>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);
        modelBuilder.Entity<OfertaConcorrencia>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);
        modelBuilder.Entity<DadosBancarios>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);
        modelBuilder.Entity<Cobranca>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);
        modelBuilder.Entity<GuardaEncomenda>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);
        modelBuilder.Entity<Local>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);
        modelBuilder.Entity<TipoMaterialCondominio>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);
        modelBuilder.Entity<Material>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);
        modelBuilder.Entity<AlocacaoMaterial>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);
        modelBuilder.Entity<EstoqueMaterialConsumo>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);
        modelBuilder.Entity<EntradaSaidaMaterialConsumo>().HasQueryFilter(e => e.IdCondominio == CurrentTenantId);
    }
}
