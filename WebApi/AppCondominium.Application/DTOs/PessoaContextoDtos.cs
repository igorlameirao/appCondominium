namespace AppCondominium.Application.DTOs;

public class PessoaContextoGravacaoRequest
{
    public string? ContextoId { get; set; }
    public string? Cpfcnpj { get; set; }
    public string? Nome { get; set; }
    public string? Telefone { get; set; }
    public string? Email { get; set; }
    public DateOnly? DataNascimento { get; set; }
    public string? NomeFantasia { get; set; }
    public DateOnly? DataFundacao { get; set; }
    public string? InscricaoEstadual { get; set; }
    public string? InscricaoMunicipal { get; set; }
    public uint? IdUnidade { get; set; }
    public uint? IdPessoaRelacionada { get; set; }
    public DateOnly? DataInicio { get; set; }
    public DateOnly? DataFim { get; set; }
    public uint? IdPerfil { get; set; }
    public byte? Responsavel { get; set; }
    public string? Observacao { get; set; }
    public DateOnly? DataAdmissao { get; set; }
    public DateOnly? DataDesligamento { get; set; }
    public string? Ctps { get; set; }
    public uint? IdFuncaoColaborador { get; set; }
    public string? CtpsArquivoBase64 { get; set; }
    public string? CtpsContentType { get; set; }
    public uint? CodigoPapelVinculo { get; set; }
    public byte? TipoColaborador { get; set; }
}

public class PessoaContextoGravacaoResponse
{
    public uint IdPessoa { get; set; }
    public string Tipo { get; set; } = "PF";
    public uint? IdVinculo { get; set; }
    public uint? IdColaborador { get; set; }
}

public class ColaboradorItemDto
{
    public uint? IdColaborador { get; set; }
    public uint IdPessoa { get; set; }
    public DateOnly? DataAdmissao { get; set; }
    public DateOnly? DataDesligamento { get; set; }
    public string? Ctps { get; set; }
    public byte? TipoColaborador { get; set; }
    public uint? IdFuncaoColaborador { get; set; }
    public string? FuncaoDescricao { get; set; }
    public bool Ativo { get; set; }
    public bool PossuiArquivoCtps { get; set; }
}

public class ColaboradorConsultaDto
{
    public ColaboradorItemDto? Ativo { get; set; }
    public List<ColaboradorItemDto> Historico { get; set; } = [];
}
