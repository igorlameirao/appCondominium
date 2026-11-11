using System.Security.Claims;
using AppCondominium.API.Controllers;
using AppCondominium.API.Storage;
using AppCondominium.Application.Authorization;
using AppCondominium.Application.Interfaces;
using AppCondominium.Application.Storage;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;
using AppCondominium.Infrastructure.Storage;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace AppCondominium.API.Tests;

public class StorageObjectKeyBuilderTests
{
    private readonly StorageObjectKeyBuilder _chaves = new(new StorageOptions
    {
        EnvironmentPrefix = "dev",
        Sistema = "app-condominium"
    });

    [Fact]
    public void Foto_de_pessoa_fica_na_plataforma_sem_condominio()
    {
        Assert.Equal(
            "dev/app-condominium/plataforma/funcionalidades/pessoas-fisicas/15/foto-perfil/original",
            _chaves.FotoPerfil(15));
    }

    [Fact]
    public void Arquivos_de_tenant_ficam_sob_o_condominio_e_a_funcionalidade()
    {
        Assert.Equal(
            "dev/app-condominium/condominios/3/funcionalidades/configuracao/imagem-login",
            _chaves.ImagemLogin(3));
        Assert.Equal(
            "dev/app-condominium/condominios/3/funcionalidades/configuracao/imagem-icone",
            _chaves.ImagemIcone(3));
        Assert.Equal(
            "dev/app-condominium/condominios/3/funcionalidades/concorrencias/ofertas/9/documento-comprobatorio",
            _chaves.DocumentoComprobatorio(3, 9));
        Assert.Equal(
            "dev/app-condominium/condominios/3/funcionalidades/pessoas-unidade/4-8/procuracao",
            _chaves.Procuracao(3, 4, 8));
    }
}

public class ContaFotoStorageTests
{
    [Fact]
    public async Task Salvar_foto_grava_no_armazenamento_zera_embedding_e_delete_remove()
    {
        var tenant = new MutableTenant();
        tenant.SetCondominio(1);
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var db = new AppDbContext(options, tenant);
        db.Pessoafisica.Add(new Pessoafisica { IdPessoa = 7, FotoEmbedding = "[1,2,3]" });
        await db.SaveChangesAsync();

        var memoria = new MemoriaStorage();
        var arquivos = new ArquivoStorage(memoria);
        var chaves = new StorageObjectKeyBuilder(new StorageOptions
        {
            EnvironmentPrefix = "dev",
            Sistema = "app-condominium"
        });
        var controller = new ContaController(
            db, tenant, new PermissaoVazia(), new SenhaNula(),
            new ArquivoAplicacao(arquivos), chaves, new FaceEmbeddingSync(db));
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    [new Claim(ClaimTypes.NameIdentifier, "7")],
                    "test"))
            }
        };

        var bytes = new byte[] { 0xFF, 0xD8, 0xFF, 0x00 };
        var arquivo = Arquivo("image/jpeg", "foto.jpg", bytes);
        Assert.IsType<NoContentResult>(await controller.SalvarFoto(arquivo, CancellationToken.None));

        var pf = await db.Pessoafisica.IgnoreQueryFilters().SingleAsync();
        Assert.Null(pf.FotoEmbedding);
        Assert.Contains(memoria.Chaves, k => k.EndsWith("/foto-perfil/original.jpg", StringComparison.Ordinal));

        var lido = Assert.IsType<FileStreamResult>(await controller.Foto(CancellationToken.None));
        using var saida = new MemoryStream();
        await lido.FileStream.CopyToAsync(saida);
        Assert.Equal(bytes, saida.ToArray());

        var png = new byte[] { 0x89, 0x50, 0x4E, 0x47 };
        Assert.IsType<NoContentResult>(await controller.SalvarFoto(Arquivo("image/png", "foto.png", png), CancellationToken.None));
        Assert.DoesNotContain(memoria.Chaves, k => k.EndsWith(".jpg", StringComparison.Ordinal));
        Assert.Contains(memoria.Chaves, k => k.EndsWith(".png", StringComparison.Ordinal));

        Assert.IsType<NoContentResult>(await controller.RemoverFoto(CancellationToken.None));
        Assert.IsType<NotFoundResult>(await controller.Foto(CancellationToken.None));
        Assert.Empty(memoria.Chaves);
    }

    private static FormFile Arquivo(string contentType, string nome, byte[] bytes)
    {
        var file = new FormFile(new MemoryStream(bytes), 0, bytes.Length, "arquivo", nome)
        {
            Headers = new HeaderDictionary()
        };
        file.ContentType = contentType;
        return file;
    }

    private sealed class MemoriaStorage : IObjectStorage
    {
        private readonly Dictionary<string, (byte[] Bytes, string Tipo)> _itens = new(StringComparer.Ordinal);
        public IEnumerable<string> Chaves => _itens.Keys;

        public async Task PutAsync(string key, Stream content, string contentType, CancellationToken ct = default)
        {
            using var ms = new MemoryStream();
            await content.CopyToAsync(ms, ct);
            _itens[key] = (ms.ToArray(), contentType);
        }

        public Task<ObjetoArmazenado?> OpenAsync(string key, CancellationToken ct = default)
        {
            if (!_itens.TryGetValue(key, out var item))
                return Task.FromResult<ObjetoArmazenado?>(null);
            return Task.FromResult<ObjetoArmazenado?>(new ObjetoArmazenado(new MemoryStream(item.Bytes), item.Tipo));
        }

        public Task DeleteAsync(string key, CancellationToken ct = default)
        {
            _itens.Remove(key);
            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<string>> ListKeysAsync(string prefix, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<string>>(_itens.Keys.Where(k => k.StartsWith(prefix, StringComparison.Ordinal)).ToList());
    }

    private sealed class PermissaoVazia : IPermissionResolver
    {
        public Task<bool> HasAsync(uint idPessoa, uint idCondominio, string permissionKey, string acao, CancellationToken ct = default) =>
            Task.FromResult(false);
        public Task<PermissionSnapshot> SnapshotAsync(uint idPessoa, uint idCondominio, CancellationToken ct = default) =>
            throw new NotSupportedException();
        public Task<IReadOnlyList<PermissaoLinha>> MatrizPerfilAsync(uint idPerfil, CancellationToken ct = default) =>
            throw new NotSupportedException();
        public Task SaveMatrizPerfilAsync(uint idPerfil, IReadOnlyList<PermissaoLinha> linhas, CancellationToken ct = default) =>
            throw new NotSupportedException();
        public Task<IReadOnlyList<PermissaoLinha>> ExcecoesAsync(uint idPessoa, uint idCondominio, CancellationToken ct = default) =>
            throw new NotSupportedException();
        public Task SaveExcecoesAsync(uint idPessoa, uint idCondominio, IReadOnlyList<PermissaoLinha> linhas, CancellationToken ct = default) =>
            throw new NotSupportedException();
    }

    private sealed class SenhaNula : IPasswordHasher
    {
        public string Hash(string password) => password;
        public bool Verify(string password, string stored) => password == stored;
    }

    private sealed class MutableTenant : ICondominioContext
    {
        public uint? IdCondominio { get; private set; }
        public void SetCondominio(uint idCondominio) => IdCondominio = idCondominio;
        public void Clear() => IdCondominio = null;
        public uint RequireTenantId() => IdCondominio ?? throw new InvalidOperationException();
    }
}
