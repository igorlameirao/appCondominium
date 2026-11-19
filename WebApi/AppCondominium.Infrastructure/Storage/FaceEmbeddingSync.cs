using System.Text.Json;
using AppCondominium.Application.Storage;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.Infrastructure.Storage;

public sealed class FaceEmbeddingSync : IFaceEmbeddingSync
{
    private readonly AppDbContext _db;
    private readonly IArquivoStorage _arquivos;
    private readonly StorageObjectKeyBuilder _chaves;
    private readonly IFaceEmbeddingGenerator _generator;

    public FaceEmbeddingSync(
        AppDbContext db,
        IArquivoStorage arquivos,
        StorageObjectKeyBuilder chaves,
        IFaceEmbeddingGenerator generator)
    {
        _db = db;
        _arquivos = arquivos;
        _chaves = chaves;
        _generator = generator;
    }

    public async Task InvalidarAsync(uint idPessoa, CancellationToken ct = default)
    {
        var pf = await _db.Pessoafisica.IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.IdPessoa == idPessoa, ct);
        if (pf == null || pf.FotoEmbedding == null)
            return;

        pf.FotoEmbedding = null;
        await _db.SaveChangesAsync(ct);
    }

    public async Task RecalcularAsync(uint idPessoa, CancellationToken ct = default)
    {
        var pf = await _db.Pessoafisica.IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.IdPessoa == idPessoa, ct);
        if (pf == null) return;

        var objeto = await _arquivos.AbrirAsync(_chaves.FotoPerfil(idPessoa), ct);
        if (objeto == null)
        {
            pf.FotoEmbedding = null;
            await _db.SaveChangesAsync(ct);
            return;
        }

        float[]? vetor;
        await using (objeto.Conteudo)
        {
            vetor = await _generator.GerarAsync(objeto.Conteudo, ct);
        }

        pf.FotoEmbedding = vetor == null ? null : JsonSerializer.Serialize(vetor);
        await _db.SaveChangesAsync(ct);
    }
}