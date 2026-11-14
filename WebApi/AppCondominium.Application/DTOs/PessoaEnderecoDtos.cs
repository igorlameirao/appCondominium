namespace AppCondominium.Application.DTOs;

public record PessoaEnderecoItemDto(
    uint IdPessoa,
    uint IdEndereco,
    uint? NumeroEndereco,
    string? ComplementoEndereco,
    byte TipoEndereco,
    string? CEP,
    string? Logradouro,
    uint? IdBairro);

public class PessoaEnderecoUpsertRequest
{
    public uint? IdEndereco { get; set; }
    public string? CEP { get; set; }
    public string? Logradouro { get; set; }
    public uint? IdBairro { get; set; }
    public uint? NumeroEndereco { get; set; }
    public string? ComplementoEndereco { get; set; }
    public byte TipoEndereco { get; set; }
}