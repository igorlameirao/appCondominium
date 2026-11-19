using AppCondominium.Application.Interfaces;

namespace AppCondominium.API.Tests;

internal sealed class FotoPerfilNula : IPessoaFotoPerfilService
{
    public Task AplicarAsync(uint idPessoa, string? fotoBase64, string? contentType, bool remover, CancellationToken ct = default)
        => Task.CompletedTask;
}