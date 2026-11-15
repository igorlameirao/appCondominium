using AppCondominium.Domain.Entities;

namespace AppCondominium.Application.Common;

/// <summary>Corpo de inclusão/alteração de Banco. IdBanco não faz parte do contrato: é gerado pelo MySQL e lido da rota.</summary>
public class BancoRequest
{
    public string? CodigoBanco { get; set; }
    public string? DigitoVerificador { get; set; }
    public string? Nome { get; set; }
    public string? ISPB { get; set; }
    public string? CNPJ { get; set; }
    public byte? Ativo { get; set; }

    public Banco ToEntity(uint? idBanco = null) => new()
    {
        IdBanco = idBanco,
        CodigoBanco = CodigoBanco,
        DigitoVerificador = DigitoVerificador,
        Nome = Nome,
        ISPB = ISPB,
        CNPJ = CNPJ,
        Ativo = Ativo,
    };
}
