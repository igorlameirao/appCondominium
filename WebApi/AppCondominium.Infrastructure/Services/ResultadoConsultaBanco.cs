namespace AppCondominium.Infrastructure.Services;

/// <summary>Resultado da consulta de Código Banco (BrasilAPI) para preenchimento do cadastro de Banco.</summary>
public sealed class ResultadoConsultaBanco
{
    public string CodigoBanco { get; set; } = string.Empty;
    public string? Nome { get; set; }
    public string? Ispb { get; set; }
}
