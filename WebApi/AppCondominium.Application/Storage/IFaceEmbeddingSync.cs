namespace AppCondominium.Application.Storage;

/// <summary>Foto no S3; <c>FotoEmbedding</c> (JSON) recalculado após upload (InsightFace + ONNX quando configurado).</summary>
public interface IFaceEmbeddingSync
{
    Task InvalidarAsync(uint idPessoa, CancellationToken ct = default);
    Task RecalcularAsync(uint idPessoa, CancellationToken ct = default);
}
