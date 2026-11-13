using System.Globalization;
using System.Text;
using System.Text.Json;

namespace AppCondominium.Tools.Bancos;

/// <summary>Registro bruto de uma fonte. Os valores ficam como texto para não perder zeros à esquerda.</summary>
public sealed record RegistroFonte(
    string Fonte,
    int Posicao,
    string? Ispb,
    bool IspbNumerico,
    string? Codigo,
    bool CodigoNumerico,
    string? NomeCompleto,
    string? NomeReduzido,
    string? Cnpj);

/// <summary>Lê o JSON da BrasilAPI (bancos.txtr) e o CSV ParticipantesSTR do BCB somente para leitura.</summary>
public static class BancoFontes
{
    public const string FonteJson = "JSON";
    public const string FonteCsv = "CSV";

    public static IReadOnlyList<RegistroFonte> LerJson(string caminho)
    {
        using var stream = File.OpenRead(caminho);
        using var doc = JsonDocument.Parse(stream);
        if (doc.RootElement.ValueKind != JsonValueKind.Array)
            throw new InvalidDataException($"{caminho}: o conteúdo deve ser um array JSON.");

        var registros = new List<RegistroFonte>();
        var posicao = 0;
        foreach (var item in doc.RootElement.EnumerateArray())
        {
            posicao++;
            if (item.ValueKind != JsonValueKind.Object)
                continue;
            var (ispb, ispbNumerico) = Valor(item, "ispb");
            var (codigo, codigoNumerico) = Valor(item, "code");
            registros.Add(new RegistroFonte(
                FonteJson, posicao, ispb, ispbNumerico, codigo, codigoNumerico,
                Valor(item, "fullName").Texto, Valor(item, "name").Texto, Valor(item, "cnpj").Texto));
        }
        return registros;
    }

    public static IReadOnlyList<RegistroFonte> LerCsv(string caminho)
    {
        var linhas = LerLinhasCsv(File.ReadAllText(caminho, new UTF8Encoding(false)));
        if (linhas.Count == 0)
            throw new InvalidDataException($"{caminho}: arquivo vazio.");

        var cabecalho = linhas[0].Select(NormalizarCabecalho).ToList();
        int Coluna(string nome, bool obrigatoria = true)
        {
            var i = cabecalho.IndexOf(nome);
            if (i < 0 && obrigatoria)
                throw new InvalidDataException($"{caminho}: coluna '{nome}' não encontrada no cabeçalho.");
            return i;
        }

        var cIspb = Coluna("ispb");
        var cCodigo = Coluna("numero_codigo");
        var cNomeExtenso = Coluna("nome_extenso");
        var cNomeReduzido = Coluna("nome_reduzido", obrigatoria: false);
        var cCnpj = Coluna("cnpj", obrigatoria: false);

        var registros = new List<RegistroFonte>();
        for (var i = 1; i < linhas.Count; i++)
        {
            var campos = linhas[i];
            if (campos.All(string.IsNullOrWhiteSpace))
                continue;
            string? Campo(int indice) => indice >= 0 && indice < campos.Count ? Vazio(campos[indice]) : null;
            registros.Add(new RegistroFonte(
                FonteCsv, i + 1, Campo(cIspb), false, Campo(cCodigo), false,
                Campo(cNomeExtenso), Campo(cNomeReduzido), Campo(cCnpj)));
        }
        return registros;
    }

    /// <summary>Parser RFC 4180 mínimo: aspas, aspas escapadas e quebras de linha dentro de campos.</summary>
    internal static List<List<string>> LerLinhasCsv(string conteudo)
    {
        var linhas = new List<List<string>>();
        var campos = new List<string>();
        var atual = new StringBuilder();
        var entreAspas = false;

        for (var i = 0; i < conteudo.Length; i++)
        {
            var c = conteudo[i];
            if (entreAspas)
            {
                if (c == '"' && i + 1 < conteudo.Length && conteudo[i + 1] == '"') { atual.Append('"'); i++; }
                else if (c == '"') entreAspas = false;
                else atual.Append(c);
                continue;
            }

            switch (c)
            {
                case '"': entreAspas = true; break;
                case ',': campos.Add(atual.ToString()); atual.Clear(); break;
                case '\r': break;
                case '\n':
                    campos.Add(atual.ToString()); atual.Clear();
                    linhas.Add(campos); campos = new List<string>();
                    break;
                default: atual.Append(c); break;
            }
        }
        if (atual.Length > 0 || campos.Count > 0)
        {
            campos.Add(atual.ToString());
            linhas.Add(campos);
        }
        return linhas;
    }

    private static string NormalizarCabecalho(string nome)
    {
        var decomposto = nome.Trim().TrimStart('\uFEFF').Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();
        foreach (var c in decomposto)
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                sb.Append(char.ToLowerInvariant(c));
        return sb.ToString();
    }

    private static (string? Texto, bool Numerico) Valor(JsonElement obj, string nome)
    {
        if (!obj.TryGetProperty(nome, out var el))
            return (null, false);
        return el.ValueKind switch
        {
            JsonValueKind.String => (Vazio(el.GetString()), false),
            JsonValueKind.Number => (el.GetRawText(), true),
            _ => (null, false),
        };
    }

    private static string? Vazio(string? valor) => string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();
}
