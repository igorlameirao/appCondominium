namespace AppCondominium.Application.Interfaces;

/// <summary>Grava ou remove foto de perfil (S3) e recalcula <c>FotoEmbedding</c> no mesmo fluxo de gravação.</summary>
public interface IPessoaFotoPerfilService
{
    Task AplicarAsync(uint idPessoa, string? fotoBase64, string? contentType, bool remover, CancellationToken ct = default);
}