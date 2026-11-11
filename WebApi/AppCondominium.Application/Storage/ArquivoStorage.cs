namespace AppCondominium.Application.Storage;

public sealed class ArquivoStorage : IArquivoStorage
{
    private readonly IObjectStorage _storage;

    public ArquivoStorage(IObjectStorage storage) => _storage = storage;

    public async Task SalvarSubstituindoAsync(string chaveSemExtensao, Stream conteudo, string contentType, CancellationToken ct = default)
    {
        var extensao = StorageMedia.ExtensionFor(contentType);
        foreach (var antiga in await ListarVariantesAsync(chaveSemExtensao, ct))
            await _storage.DeleteAsync(antiga, ct);

        await _storage.PutAsync($"{chaveSemExtensao}.{extensao}", conteudo, contentType, ct);
    }

    public async Task<ObjetoArmazenado?> AbrirAsync(string chaveSemExtensao, CancellationToken ct = default)
    {
        var chave = (await ListarVariantesAsync(chaveSemExtensao, ct)).FirstOrDefault();
        if (chave == null)
            return null;
        return await _storage.OpenAsync(chave, ct);
    }

    public async Task<bool> ExisteAsync(string chaveSemExtensao, CancellationToken ct = default) =>
        (await ListarVariantesAsync(chaveSemExtensao, ct)).Count > 0;

    public async Task ExcluirAsync(string chaveSemExtensao, CancellationToken ct = default)
    {
        foreach (var chave in await ListarVariantesAsync(chaveSemExtensao, ct))
            await _storage.DeleteAsync(chave, ct);
    }

    private async Task<IReadOnlyList<string>> ListarVariantesAsync(string chaveSemExtensao, CancellationToken ct)
    {
        var prefixo = chaveSemExtensao + ".";
        var chaves = await _storage.ListKeysAsync(prefixo, ct);
        return chaves.Where(c => c.StartsWith(prefixo, StringComparison.Ordinal)).OrderBy(c => c, StringComparer.Ordinal).ToList();
    }
}
