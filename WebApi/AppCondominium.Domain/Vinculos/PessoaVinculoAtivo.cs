namespace AppCondominium.Domain.Vinculos;

public static class PessoaVinculoAtivo
{
    public static DateOnly HojeUtc() => DateOnly.FromDateTime(DateTime.UtcNow);

    public static bool EstaAtivo(DateOnly? dataInicio, DateOnly? dataFim, DateOnly? referencia = null)
    {
        var hoje = referencia ?? HojeUtc();
        if (dataInicio is not DateOnly inicio || inicio > hoje)
            return false;
        return dataFim is null || dataFim >= hoje;
    }
}