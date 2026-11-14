namespace AppCondominium.Domain;

/// <summary>
/// Regra de vínculo ativo com base em DataInicio e DataFim (datas inclusivas; referência em UTC).
/// </summary>
public static class VinculoVigencia
{
    public static bool EstaAtivo(DateOnly? dataInicio, DateOnly? dataFim, DateOnly? referencia = null)
    {
        var hoje = referencia ?? DateOnly.FromDateTime(DateTime.UtcNow);
        if (dataInicio is { } ini && ini > hoje)
            return false;
        if (dataFim is { } fim && fim < hoje)
            return false;
        return true;
    }
}