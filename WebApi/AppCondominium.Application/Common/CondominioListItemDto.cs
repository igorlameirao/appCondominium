namespace AppCondominium.Application.Common;

/// <summary>Projeção da listagem paginada de condomínios (endereço desnormalizado para exibição).</summary>
public class CondominioListItemDto
{
    public uint? IdCondominio { get; set; }
    public string? Nome { get; set; }
    public string? Dominio { get; set; }
    public uint? IdEndereco { get; set; }
    public uint? NumeroEndereco { get; set; }
    public string? ComplementoEndereco { get; set; }
    public string? EnderecoLogradouro { get; set; }
    public string? NomeBairro { get; set; }
    public string? NomeMunicipio { get; set; }
    public string? SiglaUf { get; set; }
}
