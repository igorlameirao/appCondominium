using System.ComponentModel.DataAnnotations.Schema;

namespace AppCondominium.Domain.Entities;

public partial class Condominio
{
    [NotMapped]
    public string? EnderecoLogradouro { get; set; }

    [NotMapped]
    public string? NomeBairro { get; set; }

    [NotMapped]
    public string? NomeMunicipio { get; set; }

    [NotMapped]
    public string? SiglaUf { get; set; }
}
