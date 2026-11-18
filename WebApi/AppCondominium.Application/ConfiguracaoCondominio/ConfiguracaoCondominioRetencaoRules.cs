using ConfiguracaoCondominioEntity = AppCondominium.Domain.Entities.ConfiguracaoCondominio;

namespace AppCondominium.Application.ConfiguracaoCondominio;

public static class ConfiguracaoCondominioRetencaoRules
{
    public const int PadraoHistoricoMeses = 24;
    public const int PadraoFotosMeses = 3;

    public static int ValorEfetivoHistorico(int? gravado) =>
        gravado is null ? PadraoHistoricoMeses : gravado.Value;

    public static int ValorEfetivoFotos(int? gravado) =>
        gravado is null ? PadraoFotosMeses : gravado.Value;

    public static void Validar(ConfiguracaoCondominioEntity entity)
    {
        ValidarCampo(entity.RetencaoHistoricoEncomendasMeses, nameof(entity.RetencaoHistoricoEncomendasMeses));
        ValidarCampo(entity.RetencaoFotosEncomendasMeses, nameof(entity.RetencaoFotosEncomendasMeses));
    }

    private static void ValidarCampo(int? valor, string nomeCampo)
    {
        if (valor is null)
            return;
        if (valor < 0)
            throw new InvalidOperationException($"{nomeCampo}: informe zero (tempo indeterminado) ou um número positivo de meses.");
    }
}