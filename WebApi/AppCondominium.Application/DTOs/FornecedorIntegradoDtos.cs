namespace AppCondominium.Application.DTOs;

public class FornecedorIntegradoRequest
{
  /// <summary>Preenchido apenas na consulta para edição (não enviar no POST).</summary>
  public uint? IdPessoa { get; set; }
  public string? CPFCNPJ { get; set; }
  public string? Nome { get; set; }
  public string? Telefone { get; set; }
  public DateOnly? DataNascimento { get; set; }
  public string? Email { get; set; }
  public string? NomeFantasia { get; set; }
  public DateOnly? DataFundacao { get; set; }
  public string? InscricaoEstadual { get; set; }
  public string? InscricaoMunicipal { get; set; }
  public uint? IdResponsavel { get; set; }
  public bool Ativo { get; set; } = true;
  public bool CriarPapelVinculo { get; set; }
}

public class FornecedorIntegradoResponse
{
  public uint IdFornecedor { get; set; }
  public uint IdPessoa { get; set; }
  public uint IdCondominio { get; set; }
  public bool EhPessoaJuridica { get; set; }
  public uint? IdVinculoFornecedor { get; set; }
}