namespace AppCondominium.Application.Storage;

/// <summary>
/// A foto vive no S3. Este gancho só invalida <c>FotoEmbedding</c>.
/// O cálculo InsightFace + ONNX fica para a fase de reconhecimento facial.
/// </summary>
public interface IFaceEmbeddingSync
{
    Task InvalidarAsync(uint idPessoa, CancellationToken ct = default);
}
