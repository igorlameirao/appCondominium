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
            return new BadRequestObjectResult(new { title = "Arquivo obrigatório.", message = "Selecione uma imagem antes de enviar." });
        if (arquivo.Length > maxBytes)
            return new BadRequestObjectResult(new { title = "Arquivo grande.", message = $"O arquivo deve ter no máximo {maxBytes / (1024 * 1024)} MB." });
        var contentType = ResolverContentType(arquivo, tipos);
        if (contentType == null)
            return new BadRequestObjectResult(new { title = "Formato inválido.", message = "Use PNG, JPG ou WEBP." });

        await using var stream = arquivo.OpenReadStream();
        await _arquivos.SalvarSubstituindoAsync(radical, stream, contentType, ct);
        return new NoContentResult();
    }

    public async Task<IActionResult> ExcluirAsync(string radical, CancellationToken ct)
    {
        await _arquivos.ExcluirAsync(radical, ct);
        return new NoContentResult();
    }

    private static string? ResolverContentType(IFormFile arquivo, IReadOnlyCollection<string> tipos)
    {
        var informado = (arquivo.ContentType ?? "").Trim();
        if (tipos.Contains(informado, StringComparer.OrdinalIgnoreCase))
            return informado;

        var ext = Path.GetExtension(arquivo.FileName ?? "").TrimStart('.').ToLowerInvariant();
        var porExtensao = ext switch
        {
            "jpg" or "jpeg" => "image/jpeg",
            "png" => "image/png",
            "webp" => "image/webp",
            _ => null
        };
        if (porExtensao != null && tipos.Contains(porExtensao, StringComparer.OrdinalIgnoreCase))
            return porExtensao;

        return null;
    }
}
