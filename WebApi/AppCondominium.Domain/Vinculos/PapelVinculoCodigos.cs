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
    public const uint Visitante = 8;
    public const uint Sindico = 10;
    public const uint Subsindico = 11;
    public const uint Conselheiro = 12;
    public const uint Administradora = 13;
    public const uint Funcionario = 14;
    public const uint PrestadorCondominio = 15;
    public const uint Terceirizado = 16;
    public const uint Fornecedor = 17;
    public const uint Entregador = 18;
    public const uint RepresentanteLegal = 20;
    public const uint FamiliarPessoa = 21;
    public const uint DependentePessoa = 22;
    public const uint PrestadorUnidade = 23;

    public static readonly uint[] PapeisProprietarioPadrao = [Proprietario, Locatario];
    public static readonly uint[] PapeisMoradorPadrao = [Morador];

    public static readonly uint[] PapeisPermitemPj = [Proprietario, Locatario, Fornecedor];

  /// <summary>Sem novo vínculo fora do fluxo de Ocupantes e Proprietários (Dependente voltou só nesse contexto).</summary>
    public static readonly uint[] PapeisExcluidos =
    [
        FamiliarUnidade, Corretor, FamiliarPessoa, DependentePessoa
    ];

    public static bool PermitePessoaJuridica(uint codigo) => PapeisPermitemPj.Contains(codigo);

    public static bool EstaExcluido(uint codigo) => PapeisExcluidos.Contains(codigo);
}

public static class EscopoPapelVinculo
{
    public const byte Condominio = 1;
    public const byte Unidade = 2;
    public const byte Pessoa = 3;
}

public static class TipoColaboradorCodigos
{
    public const byte Funcionario = 1;
    public const byte Terceirizado = 2;
}
