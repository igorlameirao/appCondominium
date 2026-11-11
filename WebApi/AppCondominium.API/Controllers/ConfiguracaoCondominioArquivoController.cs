using AppCondominium.API.Authorization;
using AppCondominium.API.Storage;
using AppCondominium.Application.Interfaces;
using AppCondominium.Application.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AppCondominium.API.Controllers;

[ApiController]
[Route("api/configuracao-condominio")]
[Authorize]
[PermissionResource("CONFIGURACAOCONDOMINIO")]
public class ConfiguracaoCondominioArquivoController : ControllerBase
{
    private readonly ICondominioContext _tenant;
    private readonly ArquivoAplicacao _arquivos;
    private readonly StorageObjectKeyBuilder _chaves;

    public ConfiguracaoCondominioArquivoController(
        ICondominioContext tenant,
        ArquivoAplicacao arquivos,
        StorageObjectKeyBuilder chaves)
    {
        _tenant = tenant;
        _arquivos = arquivos;
        _chaves = chaves;
    }

    [HttpGet("{idCondominio:int}/imagem-login")]
    [HttpHead("{idCondominio:int}/imagem-login")]
    public Task<IActionResult> ImagemLogin(uint idCondominio, CancellationToken ct) =>
        Ler(idCondominio, _chaves.ImagemLogin(idCondominio), ct);

    [HttpPut("{idCondominio:int}/imagem-login")]
    [RequestSizeLimit(StorageMedia.ImagemLoginMaxBytes + 1024)]
    public Task<IActionResult> SalvarImagemLogin(uint idCondominio, IFormFile? arquivo, CancellationToken ct) =>
        Salvar(idCondominio, _chaves.ImagemLogin(idCondominio), arquivo, StorageMedia.ImagemLoginMaxBytes, StorageMedia.ImagensTema, ct);

    [HttpDelete("{idCondominio:int}/imagem-login")]
    public Task<IActionResult> RemoverImagemLogin(uint idCondominio, CancellationToken ct) =>
        Excluir(idCondominio, _chaves.ImagemLogin(idCondominio), ct);

    [HttpGet("{idCondominio:int}/imagem-icone")]
    [HttpHead("{idCondominio:int}/imagem-icone")]
    public Task<IActionResult> ImagemIcone(uint idCondominio, CancellationToken ct) =>
        Ler(idCondominio, _chaves.ImagemIcone(idCondominio), ct);

    [HttpPut("{idCondominio:int}/imagem-icone")]
    [RequestSizeLimit(StorageMedia.ImagemIconeMaxBytes + 1024)]
    public Task<IActionResult> SalvarImagemIcone(uint idCondominio, IFormFile? arquivo, CancellationToken ct) =>
        Salvar(idCondominio, _chaves.ImagemIcone(idCondominio), arquivo, StorageMedia.ImagemIconeMaxBytes, StorageMedia.ImagensTema, ct);

    [HttpDelete("{idCondominio:int}/imagem-icone")]
    public Task<IActionResult> RemoverImagemIcone(uint idCondominio, CancellationToken ct) =>
        Excluir(idCondominio, _chaves.ImagemIcone(idCondominio), ct);

    private Task<IActionResult> Ler(uint idCondominio, string radical, CancellationToken ct)
    {
        if (!TenantConfere(idCondominio))
            return Task.FromResult<IActionResult>(Forbid());
        return _arquivos.LerAsync(radical, HttpMethods.IsHead(Request.Method), ct);
    }

    private Task<IActionResult> Salvar(uint idCondominio, string radical, IFormFile? arquivo, long max, string[] tipos, CancellationToken ct)
    {
        if (!TenantConfere(idCondominio))
            return Task.FromResult<IActionResult>(Forbid());
        return _arquivos.SalvarAsync(arquivo, radical, max, tipos, ct);
    }

    private Task<IActionResult> Excluir(uint idCondominio, string radical, CancellationToken ct)
    {
        if (!TenantConfere(idCondominio))
            return Task.FromResult<IActionResult>(Forbid());
        return _arquivos.ExcluirAsync(radical, ct);
    }

    private bool TenantConfere(uint idCondominio) => _tenant.IdCondominio == idCondominio;
}
