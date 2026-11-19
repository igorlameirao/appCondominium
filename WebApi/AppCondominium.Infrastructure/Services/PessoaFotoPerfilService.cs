using AppCondominium.Application.Interfaces;
using AppCondominium.Application.Storage;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.Infrastructure.Services;

public sealed class PessoaFotoPerfilService : IPessoaFotoPerfilService
{
    private readonly AppDbContext _db;
    private readonly IArquivoStorage _arquivos;
    private readonly StorageObjectKeyBuilder _chaves;
    private readonly IFaceEmbeddingSync _embedding;

    public PessoaFotoPerfilService(
        AppDbContext db,
        IArquivoStorage arquivos,
        StorageObjectKeyBuilder chaves,
        IFaceEmbeddingSync embedding)
    {
        _db = db;
        _arquivos = arquivos;
        _chaves = chaves;
        _embedding = embedding;
    }

    public async Task AplicarAsync(uint idPessoa, string? fotoBase64, string? contentType, bool remover, CancellationToken ct = default)
    {
        var ehPf = await _db.Pessoafisica.IgnoreQueryFilters().AnyAsync(p => p.IdPessoa == idPessoa, ct);
        if (!ehPf) return;

        if (remover)
        {
            await _arquivos.ExcluirAsync(_chaves.FotoPerfil(idPessoa), ct);
            await _embedding.InvalidarAsync(idPessoa, ct);
            return;
        }

        if (string.IsNullOrWhiteSpace(fotoBase64)) return;

        var bytes = Decode(fotoBase64);
        if (bytes.Length == 0 || bytes.Length > StorageMedia.FotoPerfilMaxBytes)
            throw new InvalidOperationException("Foto inválida ou maior que o limite de 2 MB.");

        var tipo = string.IsNullOrWhiteSpace(contentType)
            ? StorageMedia.DetectContentType(bytes)
            : contentType.Trim();
        if (!StorageMedia.ImagensPerfil.Contains(tipo, StringComparer.OrdinalIgnoreCase))
            throw new InvalidOperationException("A foto deve ser JPEG ou PNG.");

        await using var stream = new MemoryStream(bytes);
        await _arquivos.SalvarSubstituindoAsync(_chaves.FotoPerfil(idPessoa), stream, tipo, ct);
        await _embedding.RecalcularAsync(idPessoa, ct);
    }

    private static byte[] Decode(string base64)
    {
        var payload = base64.Trim();
        var comma = payload.IndexOf(',');
        if (payload.StartsWith("data:", StringComparison.OrdinalIgnoreCase) && comma >= 0)
            payload = payload[(comma + 1)..];
        try
        {
            return Convert.FromBase64String(payload);
        }
        catch (FormatException)
        {
            return [];
        }
    }
}