namespace AppCondominium.Domain.Entities;

public class Endereco
{
    public uint? IdEndereco { get; set; }
    public string? CEP { get; set; }
    public string? Logradouro { get; set; }
    public uint? IdBairro { get; set; }
}