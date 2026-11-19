namespace AppCondominium.Application.Storage;

public interface IFaceEmbeddingGenerator
{
    bool Disponivel { get; }
    Task<float[]?> GerarAsync(Stream imagem, CancellationToken ct = default);
}