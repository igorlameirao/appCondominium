using System.Text.Json;
using AppCondominium.Domain.Validators;
using Microsoft.Extensions.Logging;

namespace AppCondominium.Infrastructure.Services;

/// <summary>Consulta Código Banco na BrasilAPI. Retorna null quando o código não existe.</summary>
public class BancoCodigoService
{
    private const string BrasilApiBancoUrl = "https://brasilapi.com.br/api/banks/v1/{0}";

    private readonly IHttpClientFactory _http;
    private readonly ILogger<BancoCodigoService> _logger;

    public BancoCodigoService(IHttpClientFactory http, ILogger<BancoCodigoService> logger)
    {
        _http = http;
        _logger = logger;
    }

    /// <exception cref="InvalidOperationException">Código fora do formato de 3 dígitos.</exception>
    /// <exception cref="HttpRequestException">BrasilAPI indisponível, com erro ou resposta ilegível.</exception>
    public async Task<ResultadoConsultaBanco?> ConsultarAsync(string? codigo, CancellationToken ct = default)
    {
        var cod = (codigo ?? "").Trim();
        if (cod.Length != BancoValidator.TamanhoCodigoBanco || !cod.All(char.IsAsciiDigit) || cod == "000")
            throw new InvalidOperationException($"Código Banco deve conter exatamente {BancoValidator.TamanhoCodigoBanco} dígitos.");

        var client = _http.CreateClient();
        client.DefaultRequestHeaders.TryAddWithoutValidation("User-Agent", "AppCondominium/1.0");
        client.DefaultRequestHeaders.TryAddWithoutValidation("Accept", "application/json");

        string json;
        try
        {
            using var limite = CancellationTokenSource.CreateLinkedTokenSource(ct);
            limite.CancelAfter(TimeSpan.FromSeconds(10));
            using var response = await client.GetAsync(string.Format(BrasilApiBancoUrl, cod), limite.Token);
            var status = (int)response.StatusCode;
            if (status is 400 or 404)
                return null;
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("BrasilAPI Código Banco {Codigo} retornou {Status}", cod, status);
                throw new HttpRequestException($"BrasilAPI retornou {status}.");
            }
            json = await response.Content.ReadAsStringAsync(limite.Token);
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            _logger.LogWarning("BrasilAPI Código Banco {Codigo} excedeu o tempo limite", cod);
            throw new HttpRequestException("Tempo limite excedido na BrasilAPI.");
        }

        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var nome = Texto(root, "fullName") ?? Texto(root, "name");
            var ispb = NormalizarIspb(root);
            if (nome == null && ispb == null)
                return null;
            return new ResultadoConsultaBanco { CodigoBanco = cod, Nome = nome, Ispb = ispb };
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Falha ao interpretar JSON BrasilAPI Código Banco {Codigo}", cod);
            throw new HttpRequestException("Resposta inválida da BrasilAPI.", ex);
        }
    }

    /// <summary>ISPB vem como texto com zeros à esquerda; se vier numérico, os zeros são recompostos.</summary>
    private static string? NormalizarIspb(JsonElement root)
    {
        if (!root.TryGetProperty("ispb", out var el))
            return null;
        var valor = el.ValueKind switch
        {
            JsonValueKind.String => el.GetString()?.Trim(),
            JsonValueKind.Number => el.GetRawText().PadLeft(BancoValidator.TamanhoIspb, '0'),
            _ => null,
        };
        return valor is { Length: BancoValidator.TamanhoIspb } && valor.All(char.IsAsciiDigit) ? valor : null;
    }

    private static string? Texto(JsonElement root, string nome)
    {
        if (!root.TryGetProperty(nome, out var el) || el.ValueKind != JsonValueKind.String)
            return null;
        var texto = el.GetString()?.Trim();
        return string.IsNullOrEmpty(texto) ? null : texto;
    }
}
