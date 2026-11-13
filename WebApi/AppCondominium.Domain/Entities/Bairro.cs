using System.ComponentModel.DataAnnotations.Schema;

namespace AppCondominium.Domain.Entities;

public partial class Bairro
{
    [NotMapped]
    public string? NomeMunicipio { get; set; }
}
