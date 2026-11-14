namespace AppCondominium.Application.DTOs;

public record PessoaListagemItemDto(
    uint IdPessoa,
    string Tipo,
    string Nome,
    string? Cpfcnpj,
    string? Complemento,
    string SituacaoVinculo);

public record PessoaPorDocumentoDto(
    uint IdPessoa,
    bool EhPessoaJuridica,
    string? Nome,
    string? Cpfcnpj,
    string? Telefone,
    string? Email,
    string? NomeFantasia,
    string? DataNascimento,
    string? DataFundacao,
    uint? IdResponsavel);

public record FornecedorListagemItemDto(
    uint IdFornecedor,
    uint IdPessoa,
    string NomeExibicao,
    string? Cpfcnpj,
    bool Ativo);