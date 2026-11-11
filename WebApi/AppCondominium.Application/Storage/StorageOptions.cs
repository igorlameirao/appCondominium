namespace AppCondominium.Application.Storage;

/// <summary>Seção <c>Storage:S3</c>. Segredos ficam em User Secrets ou variáveis de ambiente.</summary>
public sealed class StorageOptions
{
    public const string SectionName = "Storage:S3";

    public string Bucket { get; set; } = "";
    public string Region { get; set; } = "us-east-1";

    /// <summary>Endpoint alternativo (MinIO). Vazio usa a AWS.</summary>
    public string? ServiceUrl { get; set; }

    public string? AccessKey { get; set; }
    public string? SecretKey { get; set; }
    public string EnvironmentPrefix { get; set; } = "dev";
    public string Sistema { get; set; } = "app-condominium";
}

public sealed record ObjetoArmazenado(Stream Conteudo, string ContentType);

public interface IObjectStorage
{
    Task PutAsync(string key, Stream content, string contentType, CancellationToken ct = default);
    Task<ObjetoArmazenado?> OpenAsync(string key, CancellationToken ct = default);
    Task DeleteAsync(string key, CancellationToken ct = default);
    Task<IReadOnlyList<string>> ListKeysAsync(string prefix, CancellationToken ct = default);
}

/// <summary>
/// Grava um único objeto por radical (sem extensão) e apaga variantes anteriores
/// (<c>radical.jpg</c> some quando entra <c>radical.png</c>).
/// </summary>
public interface IArquivoStorage
{
    Task SalvarSubstituindoAsync(string chaveSemExtensao, Stream conteudo, string contentType, CancellationToken ct = default);
    Task<ObjetoArmazenado?> AbrirAsync(string chaveSemExtensao, CancellationToken ct = default);
    Task<bool> ExisteAsync(string chaveSemExtensao, CancellationToken ct = default);
    Task ExcluirAsync(string chaveSemExtensao, CancellationToken ct = default);
}
