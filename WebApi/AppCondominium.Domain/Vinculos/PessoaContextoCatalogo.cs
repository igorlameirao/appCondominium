namespace AppCondominium.Domain.Vinculos;

public sealed record PessoaContextoDefinicao(
    string Id,
    string PermissionKey,
    string TipoPessoa,
    string EscopoPapel,
    uint[] CodigosPapel,
    string[] PessoaNova,
    string[] Vinculo,
    string[] Colaborador,
    string[] TiposDado,
    byte? TipoColaborador);

public static class PessoaContextoCatalogo
{
    public static readonly PessoaContextoDefinicao[] Todos =
    [
        Def("ocupante-proprietario", "OCUPANTESPROPRIETARIOS", "PF_OU_PJ", "unidade",
            [PapelVinculoCodigos.Proprietario, PapelVinculoCodigos.Morador, PapelVinculoCodigos.Locatario, PapelVinculoCodigos.DependenteUnidade],
            ["cpfcnpj", "nome"], ["codigoPapelVinculo", "idUnidade", "dataInicio"], [], []),
        Def("prestador-unidade", "PRESTADORESUNIDADE", "PF", "unidade", [PapelVinculoCodigos.PrestadorUnidade], ["cpfcnpj", "nome", "dataNascimento"], ["codigoPapelVinculo", "idUnidade", "dataInicio"], [], []),
        Def("visitante", "VISITANTES", "PF", "unidade", [PapelVinculoCodigos.Visitante], ["cpfcnpj", "nome", "dataNascimento"], ["codigoPapelVinculo", "idUnidade", "dataInicio"], [], []),
        Def("representante-legal", "REPRESENTANTESLEGAIS", "PF", "pessoa", [PapelVinculoCodigos.RepresentanteLegal], ["cpfcnpj", "nome", "dataNascimento"], ["codigoPapelVinculo", "idPessoaRelacionada", "dataInicio"], [], []),
        Def("colaborador", "COLABORADORES", "PF", "condominio", [PapelVinculoCodigos.Funcionario, PapelVinculoCodigos.Terceirizado], ["cpfcnpj", "nome", "dataNascimento"], ["codigoPapelVinculo", "dataInicio"], ["dataAdmissao", "ctps", "idFuncaoColaborador"], ["colaborador"]),
        Def("prestador-condominio", "PRESTADORES", "PF", "condominio", [PapelVinculoCodigos.PrestadorCondominio], ["cpfcnpj", "nome", "dataNascimento"], ["codigoPapelVinculo", "dataInicio"], [], []),
        Def("fornecedor", "FORNECEDORES", "PF_OU_PJ", "condominio", [PapelVinculoCodigos.Fornecedor], ["cpfcnpj", "nome"], ["codigoPapelVinculo", "dataInicio"], [], []),
        Def("gestores", "GESTORES", "PF", "condominio",
            [
                PapelVinculoCodigos.Sindico,
                PapelVinculoCodigos.Subsindico,
                PapelVinculoCodigos.Conselheiro,
                PapelVinculoCodigos.Administradora
            ],
            ["cpfcnpj", "nome", "dataNascimento"], ["codigoPapelVinculo", "dataInicio"], [], []),
        Def("entregador", "ENTREGADORES", "PF", "condominio", [PapelVinculoCodigos.Entregador], ["cpfcnpj", "nome", "dataNascimento"], ["codigoPapelVinculo", "dataInicio"], [], []),
    ];

    public static PessoaContextoDefinicao? Obter(string? id) =>
        Todos.FirstOrDefault(c => string.Equals(c.Id, id, StringComparison.OrdinalIgnoreCase));

    public static PessoaContextoDefinicao Exigir(string? id) =>
        Obter(id) ?? throw new InvalidOperationException("Contexto de pessoa desconhecido.");

    private static PessoaContextoDefinicao Def(
        string id, string permission, string tipo, string escopo, uint[] codigos,
        string[] pessoaNova, string[] vinculo, string[] colaborador, string[] tipos,
        byte? tipoColaborador = null) =>
        new(id, permission, tipo, escopo, codigos, pessoaNova, vinculo, colaborador, tipos, tipoColaborador);
}
