using Microsoft.EntityFrameworkCore;
using AppCondominium.Domain.Entities;

namespace AppCondominium.Infrastructure.Persistence;

public partial class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<UF> UF { get; set; } = null!;
    public DbSet<Municipio> Municipio { get; set; } = null!;
    public DbSet<Bairro> Bairro { get; set; } = null!;
    public DbSet<Endereco> Endereco { get; set; } = null!;
    public DbSet<Condominio> Condominio { get; set; } = null!;
    public DbSet<ConfiguracaoCondominio> ConfiguracaoCondominio { get; set; } = null!;
    public DbSet<Bloco> Bloco { get; set; } = null!;
    public DbSet<TipoUnidade> TipoUnidade { get; set; } = null!;
    public DbSet<Unidade> Unidade { get; set; } = null!;
    public DbSet<Hidrometro> Hidrometro { get; set; } = null!;
    public DbSet<ConsumoAgua> ConsumoAgua { get; set; } = null!;
    public DbSet<Pessoafisica> Pessoafisica { get; set; } = null!;
    public DbSet<PessoaJuridica> PessoaJuridica { get; set; } = null!;
    public DbSet<Fornecedor> Fornecedor { get; set; } = null!;
    public DbSet<TipoAtividadeEconomica> TipoAtividadeEconomica { get; set; } = null!;
    public DbSet<AtividadeEconomica> AtividadeEconomica { get; set; } = null!;
    public DbSet<PessoaCondominio> PessoaCondominio { get; set; } = null!;
    public DbSet<Equipamento> Equipamento { get; set; } = null!;
    public DbSet<AluguelEquipamento> AluguelEquipamento { get; set; } = null!;
    public DbSet<Concorrencia> Concorrencia { get; set; } = null!;
    public DbSet<TipoDespesa> TipoDespesa { get; set; } = null!;
    public DbSet<Despesa> Despesa { get; set; } = null!;
    public DbSet<OfertaConcorrencia> OfertaConcorrencia { get; set; } = null!;
    public DbSet<Banco> Banco { get; set; } = null!;
    public DbSet<DadosBancarios> DadosBancarios { get; set; } = null!;
    public DbSet<Cobranca> Cobranca { get; set; } = null!;
    public DbSet<GuardaEncomenda> GuardaEncomenda { get; set; } = null!;
    public DbSet<Local> Local { get; set; } = null!;
    public DbSet<TipoMaterial> TipoMaterial { get; set; } = null!;
    public DbSet<TipoMaterialCondominio> TipoMaterialCondominio { get; set; } = null!;
    public DbSet<Material> Material { get; set; } = null!;
    public DbSet<AlocacaoMaterial> AlocacaoMaterial { get; set; } = null!;
    public DbSet<EstoqueMaterialConsumo> EstoqueMaterialConsumo { get; set; } = null!;
    public DbSet<EntradaSaidaMaterialConsumo> EntradaSaidaMaterialConsumo { get; set; } = null!;
}
