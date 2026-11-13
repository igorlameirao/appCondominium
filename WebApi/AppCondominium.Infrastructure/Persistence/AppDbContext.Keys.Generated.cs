using Microsoft.EntityFrameworkCore;
using AppCondominium.Domain.Entities;

namespace AppCondominium.Infrastructure.Persistence;

public partial class AppDbContext
{
    partial void ConfigureEntityKeys(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UF>().HasKey(e => e.SiglaUF);
        modelBuilder.Entity<Municipio>().HasKey(e => e.CodigoIBGEMunicipio);
        modelBuilder.Entity<Bairro>().HasKey(e => e.IdBairro);
        modelBuilder.Entity<Endereco>().HasKey(e => e.IdEndereco);
        modelBuilder.Entity<Condominio>().HasKey(e => e.IdCondominio);
        modelBuilder.Entity<ConfiguracaoCondominio>().HasKey(e => e.IdConfiguracao);
        modelBuilder.Entity<Bloco>().HasKey(e => e.IdBloco);
        modelBuilder.Entity<TipoUnidade>().HasKey(e => e.IdTipoUnidade);
        modelBuilder.Entity<Unidade>().HasKey(e => e.IdUnidade);
        modelBuilder.Entity<Hidrometro>().HasKey(e => e.IdHidrometro);
        modelBuilder.Entity<ConsumoAgua>().HasKey(e => e.IdConsumo);
        modelBuilder.Entity<Pessoafisica>().HasKey(e => e.IdPessoa);
        modelBuilder.Entity<PessoaJuridica>().HasKey(e => e.IdPessoa);
        modelBuilder.Entity<Fornecedor>().HasKey(e => e.IdPessoa);
        modelBuilder.Entity<TipoAtividadeEconomica>().HasKey(e => e.CodigoTipoAtividadeEconomica);
        modelBuilder.Entity<AtividadeEconomica>().HasKey(e => e.CodigoAtividadeEconomica);
        modelBuilder.Entity<PessoaCondominio>().HasKey(e => new { e.IdPessoa, e.IdCondominio });
        modelBuilder.Entity<Equipamento>().HasKey(e => e.IdEquipamento);
        modelBuilder.Entity<AluguelEquipamento>().HasKey(e => e.IdAluguelEquipamento);
        modelBuilder.Entity<Concorrencia>().HasKey(e => e.IdConcorrencia);
        modelBuilder.Entity<TipoDespesa>().HasKey(e => e.IdTipoDespesa);
        modelBuilder.Entity<Despesa>().HasKey(e => e.IdDespesa);
        modelBuilder.Entity<OfertaConcorrencia>().HasKey(e => e.IdOfertaConcorrencia);
        modelBuilder.Entity<Banco>().HasKey(e => e.IdBanco);
        modelBuilder.Entity<DadosBancarios>().HasKey(e => new { e.Conta, e.IdBanco, e.Agencia });
        modelBuilder.Entity<Cobranca>().HasKey(e => e.IdCobranca);
        modelBuilder.Entity<GuardaEncomenda>().HasKey(e => e.IdGuardaEncomenda);
        modelBuilder.Entity<Local>().HasKey(e => e.IdLocal);
        modelBuilder.Entity<TipoMaterial>().HasKey(e => e.IdTipoMaterial);
        modelBuilder.Entity<TipoMaterialCondominio>().HasKey(e => new { e.IdTipoMaterial, e.IdCondominio });
        modelBuilder.Entity<Material>().HasKey(e => e.IdMaterial);
        modelBuilder.Entity<AlocacaoMaterial>().HasKey(e => e.IdAlocacaoMaterial);
        modelBuilder.Entity<EstoqueMaterialConsumo>().HasKey(e => e.IdEstoqueMaterialConsumo);
        modelBuilder.Entity<EntradaSaidaMaterialConsumo>().HasKey(e => e.IdEntradaSaidaMaterialConsumo);
    }
}
