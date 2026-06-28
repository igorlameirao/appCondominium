using AppCondominium.Infrastructure.Repositories.Generated;
using Microsoft.Extensions.DependencyInjection;

namespace AppCondominium.Infrastructure;

public static partial class DependencyInjection
{
    static partial void RegisterGeneratedRepositories(IServiceCollection services)
    {
        services.AddScoped<UFRepository>();
        services.AddScoped<MunicipioRepository>();
        services.AddScoped<BairroRepository>();
        services.AddScoped<EnderecoRepository>();
        services.AddScoped<CondominioRepository>();
        services.AddScoped<ConfiguracaoCondominioRepository>();
        services.AddScoped<BlocoRepository>();
        services.AddScoped<TipoUnidadeRepository>();
        services.AddScoped<UnidadeRepository>();
        services.AddScoped<HidrometroRepository>();
        services.AddScoped<ConsumoAguaRepository>();
        services.AddScoped<PessoafisicaRepository>();
        services.AddScoped<PessoaJuridicaRepository>();
        services.AddScoped<FornecedorRepository>();
        services.AddScoped<TipoAtividadeEconomicaRepository>();
        services.AddScoped<AtividadeEconomicaRepository>();
        services.AddScoped<PessoaCondominioRepository>();
        services.AddScoped<EquipamentoRepository>();
        services.AddScoped<AluguelEquipamentoRepository>();
        services.AddScoped<ConcorrenciaRepository>();
        services.AddScoped<TipoDespesaRepository>();
        services.AddScoped<DespesaRepository>();
        services.AddScoped<OfertaConcorrenciaRepository>();
        services.AddScoped<BancoRepository>();
        services.AddScoped<DadosBancariosRepository>();
        services.AddScoped<CobrancaRepository>();
        services.AddScoped<GuardaEncomendaRepository>();
        services.AddScoped<LocalRepository>();
        services.AddScoped<TipoMaterialRepository>();
        services.AddScoped<TipoMaterialCondominioRepository>();
        services.AddScoped<MaterialRepository>();
        services.AddScoped<AlocacaoMaterialRepository>();
        services.AddScoped<EstoqueMaterialConsumoRepository>();
        services.AddScoped<EntradaSaidaMaterialConsumoRepository>();
    }
}
