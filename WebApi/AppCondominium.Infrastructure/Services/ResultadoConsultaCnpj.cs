namespace AppCondominium.Infrastructure.Services;

/// <summary>Resultado da consulta CNPJ (BrasilAPI / CNPJá) para preenchimento de cadastros.</summary>
public sealed class ResultadoConsultaCnpj
{
    public string Cnpj { get; set; } = string.Empty;
    public string RazaoSocial { get; set; } = string.Empty;
    public string NomeFantasia { get; set; } = string.Empty;
    public string? Cep { get; set; }
    public string? EnderecoLogradouro { get; set; }
    public uint? EnderecoNumero { get; set; }
    public string? EnderecoComplemento { get; set; }
    public uint? IdBairro { get; set; }
    public string? Bairro { get; set; }
}
