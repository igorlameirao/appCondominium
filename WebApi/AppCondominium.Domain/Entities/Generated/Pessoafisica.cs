namespace AppCondominium.Domain.Entities;

public class Pessoafisica
{
    public uint? IdPessoa { get; set; }
    public DateOnly? DataNascimento { get; set; }
    public string? Email { get; set; }
    public string? Senha { get; set; }
    public byte[]? Foto { get; set; }
    public string? FotoEmbedding { get; set; }
}