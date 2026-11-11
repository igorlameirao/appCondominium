using AppCondominium.Application.Storage;
using Microsoft.AspNetCore.Mvc;

namespace AppCondominium.API.Storage;

public sealed class ArquivoAplicacao
{
    private readonly IArquivoStorage _arquivos;

    public ArquivoAplicacao(IArquivoStorage arquivos) => _arquivos = arquivos;

    public async Task<IActionResult> LerAsync(string radical, bool somenteCabecalho, CancellationToken ct)
    {
        if (somenteCabecalho)
            return await _arquivos.ExisteAsync(radical, ct) ? new NoContentResult() : new NotFoundResult();

        var objeto = await _arquivos.AbrirAsync(radical, ct);
        if (objeto == null)
            return new NotFoundResult();
        return new FileStreamResult(objeto.Conteudo, objeto.ContentType);
    }

    public async Task<IActionResult> SalvarAsync(
        IFormFile? arquivo,
        string radical,
        long maxBytes,
        IReadOnlyCollection<string> tipos,
        CancellationToken ct)
    {
        if (arquivo == null || arquivo.Length == 0)
            return new BadRequestObjectResult("Arquivo obrigatório.");
        if (arquivo.Length > maxBytes)
            return new BadRequestObjectResult($"O arquivo deve ter no máximo {maxBytes / (1024 * 1024)} MB.");
        if (!tipos.Contains(arquivo.ContentType, StringComparer.OrdinalIgnoreCase))
            return new BadRequestObjectResult("Formato inválido.");

        await using var stream = arquivo.OpenReadStream();
        await _arquivos.SalvarSubstituindoAsync(radical, stream, arquivo.ContentType, ct);
        return new NoContentResult();
    }

    public async Task<IActionResult> ExcluirAsync(string radical, CancellationToken ct)
    {
        await _arquivos.ExcluirAsync(radical, ct);
        return new NoContentResult();
    }
}
