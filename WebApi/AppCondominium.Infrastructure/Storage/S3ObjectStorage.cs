using Amazon.S3;
using Amazon.S3.Model;
using AppCondominium.Application.Storage;

namespace AppCondominium.Infrastructure.Storage;

public sealed class S3ObjectStorage : IObjectStorage
{
    private readonly IAmazonS3 _s3;
    private readonly string _bucket;

    public S3ObjectStorage(IAmazonS3 s3, StorageOptions options)
    {
        _s3 = s3;
        _bucket = options.Bucket?.Trim() ?? "";
    }

    public async Task PutAsync(string key, Stream content, string contentType, CancellationToken ct = default)
    {
        ExigirBucket();
        try
        {
            var request = new PutObjectRequest
            {
                BucketName = _bucket,
                Key = key,
                InputStream = content,
                ContentType = contentType,
                AutoCloseStream = false
            };
            await _s3.PutObjectAsync(request, ct);
        }
        catch (AmazonS3Exception ex)
        {
            throw EncapsularFalhaS3(ex, "upload");
        }
    }

    public async Task<ObjetoArmazenado?> OpenAsync(string key, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_bucket))
            return null;
        try
        {
            var response = await _s3.GetObjectAsync(_bucket, key, ct);
            var tipo = string.IsNullOrWhiteSpace(response.Headers.ContentType)
                ? "application/octet-stream"
                : response.Headers.ContentType;
            return new ObjetoArmazenado(response.ResponseStream, tipo);
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
        catch (AmazonS3Exception ex)
        {
            throw EncapsularFalhaS3(ex, "recuperação");
        }
    }

    public async Task DeleteAsync(string key, CancellationToken ct = default)
    {
        ExigirBucket();
        try
        {
            await _s3.DeleteObjectAsync(_bucket, key, ct);
        }
        catch (AmazonS3Exception ex)
        {
            throw EncapsularFalhaS3(ex, "exclusão");
        }
    }

    public async Task<IReadOnlyList<string>> ListKeysAsync(string prefix, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_bucket))
            return [];
        var chaves = new List<string>();
        string? token = null;
        try
        {
            do
            {
                var response = await _s3.ListObjectsV2Async(new ListObjectsV2Request
                {
                    BucketName = _bucket,
                    Prefix = prefix,
                    ContinuationToken = token
                }, ct);
                if (response.S3Objects != null)
                    chaves.AddRange(response.S3Objects.Select(o => o.Key));
                token = response.IsTruncated == true ? response.NextContinuationToken : null;
            }
            while (token != null);
        }
        catch (AmazonS3Exception ex)
        {
            throw EncapsularFalhaS3(ex, "listagem");
        }

        return chaves;
    }

    private void ExigirBucket()
    {
        if (string.IsNullOrWhiteSpace(_bucket))
            throw new InvalidOperationException("Storage:S3:Bucket não configurado.");
    }

    private static InvalidOperationException EncapsularFalhaS3(AmazonS3Exception ex, string operacao) =>
        new($"AmazonS3Exception durante {operacao} (ErrorCode={ex.ErrorCode}): {ex.Message}", ex);
}
