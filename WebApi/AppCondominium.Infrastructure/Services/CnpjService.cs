using System.Text.Json;
using Microsoft.Extensions.Http;
using AppCondominium.Domain.Entities;
using AppCondominium.Domain.Validators;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AppCondominium.Infrastructure.Services;

/// <summary>Consulta CNPJ (BrasilAPI com fallback CNPJá), espelhando SGE/SGC.</summary>
public class CnpjService
{
    private const string BrasilApiCnpjUrl = "https://brasilapi.com.br/api/cnpj/v1/{0}";
    private const string CnpjaUrl = "https://open.cnpja.com/office/{0}";

    private readonly IHttpClientFactory _http;
    private readonly AppDbContext _db;
    private readonly ILogger<CnpjService> _logger;

    public CnpjService(IHttpClientFactory http, AppDbContext db, ILogger<CnpjService> logger)
    {
        _http = http;
        _db = db;
        _logger = logger;
    }

    public async Task<ResultadoConsultaCnpj?> ConsultarAsync(string cnpj, CancellationToken ct = default)
    {
        var cnpjNorm = new string((cnpj ?? "").Where(char.IsDigit).ToArray());
        if (cnpjNorm.Length != 14)
            throw new InvalidOperationException("CNPJ deve conter 14 dígitos.");
        if (!DocumentoValidator.ValidarCnpjNumerico(cnpjNorm))
            throw new InvalidOperationException("CNPJ inválido.");

        var client = _http.CreateClient();
        client.DefaultRequestHeaders.TryAddWithoutValidation("User-Agent", "AppCondominium/1.0");
        client.DefaultRequestHeaders.TryAddWithoutValidation("Accept", "application/json");

        var brasil = await ObterJsonAsync(client, string.Format(BrasilApiCnpjUrl, cnpjNorm), cnpjNorm, "BrasilAPI", ct);
        DadosCnpj? dados = null;
        if (brasil.Situacao == SituacaoConsulta.Ok)
            dados = InterpretarBrasilApi(brasil.Json!, cnpjNorm);
        else if (brasil.Situacao == SituacaoConsulta.Indisponivel)
        {
            _logger.LogWarning("BrasilAPI indisponível para CNPJ {Cnpj}; consultando CNPJá", cnpjNorm);
            var alternativa = await ObterJsonAsync(client, string.Format(CnpjaUrl, cnpjNorm), cnpjNorm, "CNPJá", ct);
            if (alternativa.Situacao == SituacaoConsulta.Ok)
                dados = InterpretarCnpja(alternativa.Json!, cnpjNorm);
            else if (alternativa.Situacao == SituacaoConsulta.Indisponivel)
                throw new InvalidOperationException("A consulta de CNPJ está indisponível no momento. Tente novamente.");
        }

        if (dados is null)
            return null;

        uint? numero = null;
        if (!string.IsNullOrEmpty(dados.Numero) && uint.TryParse(dados.Numero, out var n) && n > 0)
            numero = n;

        uint? idBairro = null;
        string? bairroRotulo = null;

        if (dados.Cep.Length == 8)
        {
            try
            {
                var viaCep = await ResolverViaCepAsync(client, dados.Cep, ct);
                if (viaCep is not null)
                {
                    idBairro = viaCep.Value.IdBairro;
                    bairroRotulo = viaCep.Value.BairroRotulo;
                    if (string.IsNullOrWhiteSpace(dados.Logradouro) && !string.IsNullOrWhiteSpace(viaCep.Value.Logradouro))
                        dados = dados with { Logradouro = Truncar(viaCep.Value.Logradouro, 150) };
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "ViaCEP falhou para CEP {Cep} (CNPJ {Cnpj})", dados.Cep, cnpjNorm);
            }
        }

        if (idBairro is null && dados.CodigoIbge > 0 && dados.Uf.Length == 2)
        {
            try
            {
                var resolved = await GarantirBairroBrasilApiAsync(dados.Uf, dados.CodigoIbge, dados.Municipio, dados.Bairro, ct);
                if (resolved is not null)
                {
                    idBairro = resolved.Value.IdBairro;
                    bairroRotulo = resolved.Value.BairroRotulo;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Fallback bairro BrasilAPI falhou para CNPJ {Cnpj}", cnpjNorm);
            }
        }

        return new ResultadoConsultaCnpj
        {
            Cnpj = cnpjNorm,
            RazaoSocial = dados.Razao,
            NomeFantasia = dados.Fantasia,
            Cep = dados.Cep.Length == 8 ? dados.Cep : null,
            EnderecoLogradouro = string.IsNullOrWhiteSpace(dados.Logradouro) ? null : dados.Logradouro,
            EnderecoNumero = numero,
            EnderecoComplemento = string.IsNullOrWhiteSpace(dados.Complemento) ? null : dados.Complemento,
            IdBairro = idBairro,
            Bairro = bairroRotulo
        };
    }

    private async Task<(uint IdBairro, string BairroRotulo, string? Logradouro)?> ResolverViaCepAsync(
        HttpClient client, string cep, CancellationToken ct)
    {
        using var response = await client.GetAsync($"https://viacep.com.br/ws/{cep}/json/", ct);
        if (!response.IsSuccessStatusCode) return null;
        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        if (root.TryGetProperty("erro", out var erro) && erro.ValueKind == JsonValueKind.True)
            return null;

        var uf = Texto(root, "uf");
        var ibge = Texto(root, "ibge");
        var localidade = Texto(root, "localidade");
        var bairroNome = Texto(root, "bairro");
        var logradouro = Texto(root, "logradouro");
        if (string.IsNullOrWhiteSpace(uf) || ibge.Length < 7 || !uint.TryParse(ibge, out var codigoMunicipio))
            return null;

        var resolved = await GarantirBairroBrasilApiAsync(uf, codigoMunicipio, localidade, bairroNome, ct);
        if (resolved is null) return null;
        return (resolved.Value.IdBairro, resolved.Value.BairroRotulo, logradouro);
    }

    private async Task<(uint IdBairro, string BairroRotulo)?> GarantirBairroBrasilApiAsync(
        string ufSigla,
        uint codigoIbgeMunicipio,
        string municipioNome,
        string bairroNome,
        CancellationToken ct)
    {
        var estado = await _db.UF.FirstOrDefaultAsync(u => u.SiglaUF == ufSigla, ct);
        if (estado is null)
        {
            var codigoUf = (byte)Math.Clamp(codigoIbgeMunicipio / 100000, 0, 255);
            estado = new UF { SiglaUF = ufSigla, Estado = ufSigla, CodigoIBGE = codigoUf };
            _db.UF.Add(estado);
            await _db.SaveChangesAsync(ct);
        }

        var municipio = await _db.Municipio.FirstOrDefaultAsync(m => m.CodigoIBGEMunicipio == codigoIbgeMunicipio, ct);
        if (municipio is null)
        {
            var nomeMun = string.IsNullOrWhiteSpace(municipioNome) ? "Não informado" : Truncar(municipioNome.Trim(), 150);
            municipio = new Municipio { CodigoIBGEMunicipio = codigoIbgeMunicipio, Nome = nomeMun, SiglaUF = ufSigla };
            _db.Municipio.Add(municipio);
            await _db.SaveChangesAsync(ct);
        }

        var nomeBairro = string.IsNullOrWhiteSpace(bairroNome) ? "Centro" : Truncar(bairroNome.Trim(), 150);
        var bairro = await _db.Bairro
            .FirstOrDefaultAsync(b => b.Nome == nomeBairro && b.CodigoIBGEMunicipio == codigoIbgeMunicipio, ct);
        if (bairro is null)
        {
            bairro = new Bairro { Nome = nomeBairro, CodigoIBGEMunicipio = codigoIbgeMunicipio };
            _db.Bairro.Add(bairro);
            await _db.SaveChangesAsync(ct);
        }

        if (bairro.IdBairro is not uint idBairro || idBairro == 0)
            return null;
        var rotulo = $"{nomeBairro} - {municipio.Nome} {ufSigla}".Trim();
        return (idBairro, rotulo);
    }

    private async Task<(string? Json, SituacaoConsulta Situacao)> ObterJsonAsync(
        HttpClient client, string url, string cnpjNorm, string origem, CancellationToken ct)
    {
        try
        {
            using var limite = CancellationTokenSource.CreateLinkedTokenSource(ct);
            limite.CancelAfter(TimeSpan.FromSeconds(25));
            using var response = await client.GetAsync(url, limite.Token);
            var json = await response.Content.ReadAsStringAsync(ct);
            if (response.IsSuccessStatusCode)
                return (json, SituacaoConsulta.Ok);

            var status = (int)response.StatusCode;
            _logger.LogWarning("{Origem} CNPJ {Cnpj} retornou {Status}", origem, cnpjNorm, status);
            return status is 400 or 404
                ? (null, SituacaoConsulta.NaoEncontrado)
                : (null, SituacaoConsulta.Indisponivel);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha HTTP ao consultar {Origem} CNPJ {Cnpj}", origem, cnpjNorm);
            return (null, SituacaoConsulta.Indisponivel);
        }
    }

    private DadosCnpj? InterpretarBrasilApi(string json, string cnpjNorm)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var razao = Truncar(Texto(root, "razao_social"), 150);
            if (string.IsNullOrWhiteSpace(razao))
                return null;

            var fantasia = Truncar(Texto(root, "nome_fantasia"), 150);
            if (string.IsNullOrWhiteSpace(fantasia))
                fantasia = razao;

            return new DadosCnpj(
                razao,
                fantasia,
                Digitos(Texto(root, "cep")),
                Truncar(Texto(root, "logradouro"), 150),
                Truncar(Texto(root, "complemento"), 150),
                Digitos(Texto(root, "numero")),
                Texto(root, "bairro"),
                Texto(root, "municipio"),
                Texto(root, "uf").ToUpperInvariant(),
                (uint)Math.Max(0, Inteiro(root, "codigo_municipio_ibge")));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao interpretar JSON BrasilAPI CNPJ {Cnpj}", cnpjNorm);
            return null;
        }
    }

    private DadosCnpj? InterpretarCnpja(string json, string cnpjNorm)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            if (!root.TryGetProperty("company", out var company) || !root.TryGetProperty("address", out var address))
                return null;

            var razao = Truncar(Texto(company, "name"), 150);
            if (string.IsNullOrWhiteSpace(razao))
                return null;

            var fantasia = Truncar(Texto(root, "alias"), 150);
            if (string.IsNullOrWhiteSpace(fantasia))
                fantasia = razao;

            return new DadosCnpj(
                razao,
                fantasia,
                Digitos(Texto(address, "zip")),
                Truncar(Texto(address, "street"), 150),
                Truncar(Texto(address, "details"), 150),
                Digitos(Texto(address, "number")),
                Texto(address, "district"),
                Texto(address, "city"),
                Texto(address, "state").ToUpperInvariant(),
                0);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao interpretar JSON CNPJá CNPJ {Cnpj}", cnpjNorm);
            return null;
        }
    }

    private enum SituacaoConsulta { Ok, NaoEncontrado, Indisponivel }

    private sealed record DadosCnpj(
        string Razao,
        string Fantasia,
        string Cep,
        string Logradouro,
        string Complemento,
        string Numero,
        string Bairro,
        string Municipio,
        string Uf,
        uint CodigoIbge);

    private static string Texto(JsonElement root, string name)
    {
        if (!root.TryGetProperty(name, out var el) || el.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined)
            return "";
        return el.ValueKind switch
        {
            JsonValueKind.String => el.GetString()?.Trim() ?? "",
            JsonValueKind.Number => el.ToString(),
            _ => el.ToString()
        };
    }

    private static int Inteiro(JsonElement root, string name)
    {
        if (!root.TryGetProperty(name, out var el) || el.ValueKind == JsonValueKind.Null)
            return 0;
        if (el.ValueKind == JsonValueKind.Number && el.TryGetInt32(out var n))
            return n;
        return int.TryParse(Digitos(el.ToString()), out var p) ? p : 0;
    }

    private static string Digitos(string? s) => new string((s ?? "").Where(char.IsDigit).ToArray());

    private static string Truncar(string value, int max) =>
        value.Length <= max ? value : value[..max];
}
