namespace AppCondominium.Application.DTOs;

public class PessoaFisicaIntegradaRequest
{
    public string? CPFCNPJ { get; set; }
    public string? Nome { get; set; }
    public string? Telefone { get; set; }
    public DateOnly? DataNascimento { get; set; }
    public string? Email { get; set; }
    public string? Senha { get; set; }
}

public class PessoaFisicaIntegradaResponse
{
    public uint IdPessoa { get; set; }
    public PessoaFisicaIntegradaRequest Dados { get; set; } = new();
}

public class PessoaJuridicaIntegradaRequest
{
    public string? CPFCNPJ { get; set; }
    public string? Nome { get; set; }
    public string? Telefone { get; set; }
    public string? NomeFantasia { get; set; }
    public DateOnly? DataFundacao { get; set; }
    public string? InscricaoEstadual { get; set; }
    public string? InscricaoMunicipal { get; set; }
    public uint? IdResponsavel { get; set; }
}

public class PessoaJuridicaIntegradaResponse
{
    public uint IdPessoa { get; set; }
    public PessoaJuridicaIntegradaRequest Dados { get; set; } = new();
}