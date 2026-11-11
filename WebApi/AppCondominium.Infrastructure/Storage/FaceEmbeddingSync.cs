using AppCondominium.Application.Storage;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.Infrastructure.Storage;

public sealed class FaceEmbeddingSync : IFaceEmbeddingSync
{
    private readonly AppDbContext _db;

    public FaceEmbeddingSync(AppDbContext db) => _db = db;

    public async Task InvalidarAsync(uint idPessoa, CancellationToken ct = default)
    {
        var pf = await _db.Pessoafisica.IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.IdPessoa == idPessoa, ct);
        if (pf == null || pf.FotoEmbedding == null)
            return;

        // TODO: worker InsightFace + ONNX deve gerar FotoEmbedding a partir da foto no S3.
        pf.FotoEmbedding = null;
        await _db.SaveChangesAsync(ct);
    }
}
