namespace AppCondominium.Domain.Vinculos;

public static class PapelVinculoCodigos
{
    public const uint Proprietario = 1;
    public const uint Morador = 2;
    public const uint Locatario = 3;
    public const uint DependenteUnidade = 4;
    public const uint FamiliarUnidade = 5;
    public const uint Hospede = 6;
    public const uint Corretor = 7;
    public const uint Sindico = 10;
    public const uint Funcionario = 14;
    public const uint Fornecedor = 17;
    public const uint RepresentanteLegal = 20;

    public static readonly uint[] PapeisProprietarioPadrao = [Proprietario, Locatario, Corretor];
    public static readonly uint[] PapeisMoradorPadrao = [Morador, DependenteUnidade, FamiliarUnidade, Hospede];
}

public static class EscopoPapelVinculo
{
    public const byte Condominio = 1;
    public const byte Unidade = 2;
    public const byte Pessoa = 3;
}