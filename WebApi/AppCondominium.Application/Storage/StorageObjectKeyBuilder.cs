namespace AppCondominium.Application.Storage;

/// <summary>
/// Chaves determinísticas, sem coluna no banco.
/// Tenant: <c>{sistema}/{env}/condominios/{id}/funcionalidades/...</c> (prefixo IAM: <c>app-condominium/dev/</c>)
/// Pessoa (foto única): <c>{sistema}/{env}/plataforma/funcionalidades/...</c>
/// O valor retornado não inclui extensão; o arquivo real é <c>{radical}.{ext}</c>.
/// </summary>
public sealed class StorageObjectKeyBuilder
{
    private readonly StorageOptions _options;

    public StorageObjectKeyBuilder(StorageOptions options) => _options = options;

    public string FotoPerfil(uint idPessoa) =>
        $"{Plataforma()}/funcionalidades/pessoas-fisicas/{idPessoa}/foto-perfil/original";

    public string ImagemLogin(uint idCondominio) =>
        $"{Condominio(idCondominio)}/funcionalidades/configuracao/imagem-login";

    public string ImagemIcone(uint idCondominio) =>
        $"{Condominio(idCondominio)}/funcionalidades/configuracao/imagem-icone";

    public string DocumentoComprobatorio(uint idCondominio, uint idOferta) =>
        $"{Condominio(idCondominio)}/funcionalidades/concorrencias/ofertas/{idOferta}/documento-comprobatorio";

    public string Procuracao(uint idCondominio, uint idPessoa, uint idUnidade) =>
        $"{Condominio(idCondominio)}/funcionalidades/pessoas-unidade/{idPessoa}-{idUnidade}/procuracao";

    public string LocalizacaoUnidade(uint idCondominio, uint idTipoUnidade) =>
        $"{Condominio(idCondominio)}/funcionalidades/tipos-unidade/{idTipoUnidade}/localizacao-unidade";

    public string PlantaBaixa(uint idCondominio, uint idTipoUnidade) =>
        $"{Condominio(idCondominio)}/funcionalidades/tipos-unidade/{idTipoUnidade}/planta-baixa";

    private string Root() => $"{Segmento(_options.Sistema)}/{Segmento(_options.EnvironmentPrefix)}";

    private string Plataforma() => $"{Root()}/plataforma";

    private string Condominio(uint idCondominio) => $"{Root()}/condominios/{idCondominio}";

    private static string Segmento(string? valor)
    {
        var texto = (valor ?? "").Trim().Trim('/');
        if (string.IsNullOrEmpty(texto))
            throw new InvalidOperationException("Storage:S3 exige EnvironmentPrefix e Sistema.");
        return texto;
    }
}
