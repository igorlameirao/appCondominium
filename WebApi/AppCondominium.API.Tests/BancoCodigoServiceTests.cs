using System.Net;
using AppCondominium.Infrastructure.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace AppCondominium.API.Tests;

public class BancoCodigoServiceTests
{
    private sealed class RespostaFixa(HttpStatusCode status, string corpo) : HttpMessageHandler
    {
        public List<string> Urls { get; } = new();

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            Urls.Add(request.RequestUri!.ToString());
            return Task.FromResult(new HttpResponseMessage(status) { Content = new StringContent(corpo) });
        }
    }

    private sealed class Fabrica(HttpMessageHandler handler) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new(handler, disposeHandler: false);
    }

    private static (BancoCodigoService Servico, RespostaFixa Handler) Criar(HttpStatusCode status, string corpo)
    {
        var handler = new RespostaFixa(status, corpo);
        return (new BancoCodigoService(new Fabrica(handler), NullLogger<BancoCodigoService>.Instance), handler);
    }

    [Fact]
    public async Task Preenche_nome_completo_e_ispb_com_zeros()
    {
        var (servico, handler) = Criar(HttpStatusCode.OK,
            """{"ispb":"00000000","name":"BCO DO BRASIL S.A.","code":1,"fullName":"Banco do Brasil S.A."}""");

        var r = await servico.ConsultarAsync("001");

        Assert.NotNull(r);
        Assert.Equal("001", r!.CodigoBanco);
        Assert.Equal("Banco do Brasil S.A.", r.Nome);
        Assert.Equal("00000000", r.Ispb);
        Assert.Equal("https://brasilapi.com.br/api/banks/v1/001", Assert.Single(handler.Urls));
    }

    [Fact]
    public async Task Usa_name_quando_fullName_ausente_e_recompoe_ispb_numerico()
    {
        var (servico, _) = Criar(HttpStatusCode.OK, """{"ispb":208,"name":"BRB - BCO DE BRASILIA S.A.","code":70,"fullName":null}""");
        var r = await servico.ConsultarAsync("070");
        Assert.Equal("BRB - BCO DE BRASILIA S.A.", r!.Nome);
        Assert.Equal("00000208", r.Ispb);
    }

    [Fact]
    public async Task Codigo_inexistente_retorna_null()
    {
        var (servico, _) = Criar(HttpStatusCode.NotFound, """{"message":"Código bancário não encontrado"}""");
        Assert.Null(await servico.ConsultarAsync("999"));
    }

    [Theory]
    [InlineData("1")]
    [InlineData("000")]
    [InlineData("12a")]
    [InlineData(null)]
    public async Task Codigo_fora_do_formato_nao_consulta(string? codigo)
    {
        var (servico, handler) = Criar(HttpStatusCode.OK, "{}");
        await Assert.ThrowsAsync<InvalidOperationException>(() => servico.ConsultarAsync(codigo));
        Assert.Empty(handler.Urls);
    }

    [Fact]
    public async Task Falha_da_brasilapi_vira_indisponibilidade()
    {
        var (servico, _) = Criar(HttpStatusCode.InternalServerError, "erro");
        await Assert.ThrowsAsync<HttpRequestException>(() => servico.ConsultarAsync("001"));
    }
}
