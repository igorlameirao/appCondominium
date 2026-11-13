using System.Text.RegularExpressions;
using AppCondominium.Domain.Entities;
using AppCondominium.Domain.Validators;

namespace AppCondominium.Tools.Bancos;

public enum SituacaoImportacao { Incluir, Ignorado, Divergente, Rejeitado }

public sealed class ItemImportacao
{
    public SituacaoImportacao Situacao { get; set; }
    public string? Ispb { get; init; }
    public string Fontes { get; init; } = "";
    public Banco? Proposto { get; init; }
    public uint? IdExistente { get; set; }
    public List<string> Motivos { get; } = new();
    public List<string> Observacoes { get; } = new();
}

public sealed class PlanoImportacao
{
    public List<ItemImportacao> Itens { get; } = new();
    public IEnumerable<ItemImportacao> Com(SituacaoImportacao s) => Itens.Where(i => i.Situacao == s);
    public int Total(SituacaoImportacao s) => Itens.Count(i => i.Situacao == s);
}

/// <summary>
/// Cruza as fontes por ISPB e compara com os bancos existentes, sem acesso a banco de dados.
/// Nunca propõe alteração ou exclusão de registro existente: só inclusões de ISPB/Código ainda livres.
/// </summary>
public static class BancoImportacaoPlanejador
{
    private static readonly Regex Espacos = new(@"\s+", RegexOptions.Compiled);
    private static readonly HashSet<string> CodigoIndisponivel = new(StringComparer.OrdinalIgnoreCase) { "n/a", "na", "-", "--" };

    public static PlanoImportacao Planejar(IEnumerable<RegistroFonte> registros, IReadOnlyCollection<Banco> existentes)
    {
        var plano = new PlanoImportacao();
        var porIspb = new Dictionary<string, List<RegistroFonte>>();

        foreach (var r in registros)
        {
            var ispb = NormalizarIspb(r, out var erroIspb);
            if (ispb == null)
            {
                var rejeitado = new ItemImportacao { Situacao = SituacaoImportacao.Rejeitado, Ispb = r.Ispb, Fontes = $"{r.Fonte}#{r.Posicao}" };
                rejeitado.Motivos.Add(erroIspb!);
                plano.Itens.Add(rejeitado);
                continue;
            }
            if (!porIspb.TryGetValue(ispb, out var lista))
                porIspb[ispb] = lista = new List<RegistroFonte>();
            lista.Add(r);
        }

        var candidatos = porIspb.OrderBy(p => p.Key, StringComparer.Ordinal)
            .Select(p => Consolidar(p.Key, p.Value))
            .ToList();
        plano.Itens.AddRange(candidatos);

        MarcarCodigosRepetidos(candidatos);
        CompararComExistentes(candidatos, existentes);

        plano.Itens.Sort((a, b) =>
        {
            var c = a.Situacao.CompareTo(b.Situacao);
            if (c != 0) return c;
            c = string.CompareOrdinal(a.Proposto?.CodigoBanco ?? "~", b.Proposto?.CodigoBanco ?? "~");
            return c != 0 ? c : string.CompareOrdinal(a.Ispb, b.Ispb);
        });
        return plano;
    }

    /// <summary>Reaplica o plano sobre os existentes simulados: uma segunda execução não pode propor novas inclusões.</summary>
    public static bool VerificarIdempotencia(IEnumerable<RegistroFonte> registros, IReadOnlyCollection<Banco> existentes, PlanoImportacao plano)
    {
        var proximoId = existentes.Select(e => e.IdBanco ?? 0).DefaultIfEmpty(0u).Max();
        var simulados = existentes.ToList();
        foreach (var item in plano.Com(SituacaoImportacao.Incluir))
            simulados.Add(Copiar(item.Proposto!, ++proximoId));
        return Planejar(registros, simulados).Total(SituacaoImportacao.Incluir) == 0;
    }

    private static ItemImportacao Consolidar(string ispb, List<RegistroFonte> grupo)
    {
        var fontes = string.Join("+", grupo.Select(g => g.Fonte).Distinct().OrderBy(f => f));
        var motivos = new List<string>();
        var observacoes = new List<string>();

        RegistroFonte? Unico(string fonte)
        {
            var daFonte = grupo.Where(g => g.Fonte == fonte).ToList();
            if (daFonte.Count <= 1) return daFonte.FirstOrDefault();
            var distintos = daFonte.Select(d => (NormalizarCodigo(d, out _), NormalizarNome(d.NomeCompleto), NormalizarNome(d.NomeReduzido), d.Cnpj)).Distinct().Count();
            if (distintos == 1)
            {
                observacoes.Add($"ISPB repetido {daFonte.Count}x no {fonte} com dados idênticos (posições {string.Join(", ", daFonte.Select(d => d.Posicao))}).");
                return daFonte[0];
            }
            motivos.Add($"ISPB repetido no {fonte} com dados conflitantes (posições {string.Join(", ", daFonte.Select(d => d.Posicao))}).");
            return null;
        }

        var csv = Unico(BancoFontes.FonteCsv);
        var json = Unico(BancoFontes.FonteJson);
        if (motivos.Count > 0)
            return Item(SituacaoImportacao.Rejeitado, ispb, fontes, null, motivos, observacoes);

        if (csv == null || json == null)
            observacoes.Add($"Presente apenas no {(csv != null ? "CSV" : "JSON")}.");

        var codigoCsv = csv == null ? null : NormalizarCodigo(csv, out var obsCsv, observacoes);
        var codigoJson = json == null ? null : NormalizarCodigo(json, out var obsJson, observacoes);
        var divergente = false;
        if (codigoCsv != null && codigoJson != null && codigoCsv != codigoJson)
        {
            motivos.Add($"Código Banco diverge entre arquivos (CSV={codigoCsv}, JSON={codigoJson}).");
            divergente = true;
        }
        else if (csv != null && json != null && (codigoCsv == null) != (codigoJson == null))
            observacoes.Add($"Código Banco informado apenas no {(codigoCsv != null ? "CSV" : "JSON")}.");

        var nomeCsv = NormalizarNome(csv?.NomeCompleto);
        var nomeJson = NormalizarNome(json?.NomeCompleto);
        var nome = nomeCsv ?? nomeJson;
        if (nomeCsv != null && nomeJson != null && nomeCsv != nomeJson)
            observacoes.Add($"Nome diverge entre arquivos; usado Nome_Extenso do CSV (JSON fullName='{nomeJson}').");
        if (nome == null)
        {
            nome = NormalizarNome(csv?.NomeReduzido) ?? NormalizarNome(json?.NomeReduzido);
            if (nome != null)
                observacoes.Add("Nome completo ausente; usado nome reduzido.");
        }

        var cnpjCsv = csv == null ? null : NormalizarCnpj(csv, observacoes);
        var cnpjJson = json == null ? null : NormalizarCnpj(json, observacoes);
        if (cnpjCsv != null && cnpjJson != null && cnpjCsv != cnpjJson)
        {
            motivos.Add($"CNPJ diverge entre arquivos (CSV={cnpjCsv}, JSON={cnpjJson}).");
            divergente = true;
        }

        var banco = new Banco
        {
            CodigoBanco = codigoCsv ?? codigoJson,
            DigitoVerificador = null,
            Nome = nome,
            ISPB = ispb,
            CNPJ = cnpjCsv ?? cnpjJson,
            Ativo = 1,
        };
        BancoValidator.Normalizar(banco);
        var erro = BancoValidator.Validar(banco);
        if (erro != null)
        {
            motivos.Add(erro);
            return Item(SituacaoImportacao.Rejeitado, ispb, fontes, banco, motivos, observacoes);
        }

        return Item(divergente ? SituacaoImportacao.Divergente : SituacaoImportacao.Incluir, ispb, fontes, banco, motivos, observacoes);
    }

    private static void MarcarCodigosRepetidos(List<ItemImportacao> candidatos)
    {
        var repetidos = candidatos
            .Where(c => c.Situacao == SituacaoImportacao.Incluir && c.Proposto?.CodigoBanco != null)
            .GroupBy(c => c.Proposto!.CodigoBanco!)
            .Where(g => g.Count() > 1);
        foreach (var grupo in repetidos)
            foreach (var item in grupo)
            {
                item.Situacao = SituacaoImportacao.Divergente;
                var outros = string.Join(", ", grupo.Where(o => o != item).Select(o => o.Ispb));
                item.Motivos.Add($"Código Banco {grupo.Key} também atribuído ao(s) ISPB {outros} nos arquivos.");
            }
    }

    private static void CompararComExistentes(List<ItemImportacao> candidatos, IReadOnlyCollection<Banco> existentes)
    {
        var porIspb = existentes.Where(e => e.ISPB != null).ToDictionary(e => e.ISPB!, StringComparer.Ordinal);
        var porCodigo = existentes.Where(e => e.CodigoBanco != null).ToDictionary(e => e.CodigoBanco!, StringComparer.Ordinal);

        foreach (var item in candidatos.Where(c => c.Situacao is SituacaoImportacao.Incluir or SituacaoImportacao.Divergente))
        {
            var proposto = item.Proposto!;
            if (porIspb.TryGetValue(item.Ispb!, out var atual))
            {
                item.IdExistente = atual.IdBanco;
                var diferencas = Diferencas(atual, proposto).ToList();
                if (diferencas.Count == 0)
                {
                    if (item.Situacao == SituacaoImportacao.Incluir)
                        item.Situacao = SituacaoImportacao.Ignorado;
                    item.Observacoes.Insert(0, $"Já cadastrado (IdBanco {atual.IdBanco}) com os mesmos dados.");
                }
                else
                {
                    item.Situacao = SituacaoImportacao.Divergente;
                    item.Motivos.Add($"Já cadastrado (IdBanco {atual.IdBanco}) com dados diferentes; registro existente preservado: {string.Join("; ", diferencas)}.");
                }
                continue;
            }

            if (proposto.CodigoBanco != null && porCodigo.TryGetValue(proposto.CodigoBanco, out var dono))
            {
                item.Situacao = SituacaoImportacao.Divergente;
                item.IdExistente = dono.IdBanco;
                item.Motivos.Add($"Código Banco {proposto.CodigoBanco} já pertence ao IdBanco {dono.IdBanco} (ISPB {dono.ISPB}, '{dono.Nome}').");
            }
        }
    }

    /// <summary>Compara apenas campos informados pelos arquivos; ausência no arquivo não conta como divergência.</summary>
    private static IEnumerable<string> Diferencas(Banco atual, Banco proposto)
    {
        if (proposto.CodigoBanco != null && proposto.CodigoBanco != atual.CodigoBanco)
            yield return $"Código Banco cadastrado={atual.CodigoBanco ?? "(vazio)"}, arquivo={proposto.CodigoBanco}";
        if (proposto.Nome != null && proposto.Nome != NormalizarNome(atual.Nome))
            yield return $"Nome cadastrado='{atual.Nome}', arquivo='{proposto.Nome}'";
        if (proposto.CNPJ != null && proposto.CNPJ != atual.CNPJ)
            yield return $"CNPJ cadastrado={atual.CNPJ ?? "(vazio)"}, arquivo={proposto.CNPJ}";
        if (proposto.DigitoVerificador != null && proposto.DigitoVerificador != atual.DigitoVerificador)
            yield return $"Dígito cadastrado={atual.DigitoVerificador ?? "(vazio)"}, arquivo={proposto.DigitoVerificador}";
    }

    internal static string? NormalizarIspb(RegistroFonte r, out string? erro)
    {
        erro = null;
        var valor = r.Ispb?.Trim();
        if (string.IsNullOrEmpty(valor))
        {
            erro = "ISPB ausente.";
            return null;
        }
        if (!valor.All(char.IsAsciiDigit))
        {
            erro = $"ISPB '{valor}' contém caracteres não numéricos.";
            return null;
        }
        if (r.IspbNumerico && valor.Length < BancoValidator.TamanhoIspb)
            valor = valor.PadLeft(BancoValidator.TamanhoIspb, '0');
        if (valor.Length != BancoValidator.TamanhoIspb)
        {
            erro = $"ISPB '{valor}' deve conter exatamente {BancoValidator.TamanhoIspb} dígitos.";
            return null;
        }
        return valor;
    }

    /// <summary>Aceita 1 a 3 dígitos (número sem zeros à esquerda) entre 001 e 999; "n/a" e vazio significam indisponível.</summary>
    internal static string? NormalizarCodigo(RegistroFonte r, out string? observacao, List<string>? observacoes = null)
    {
        observacao = null;
        var valor = r.Codigo?.Trim();
        if (string.IsNullOrEmpty(valor) || CodigoIndisponivel.Contains(valor))
            return null;
        if (valor.Length <= BancoValidator.TamanhoCodigoBanco && valor.All(char.IsAsciiDigit) && int.Parse(valor) > 0)
            return valor.PadLeft(BancoValidator.TamanhoCodigoBanco, '0');

        observacao = $"Código '{valor}' do {r.Fonte} é inválido para Código Banco (001 a 999); campo deixado vazio.";
        observacoes?.Add(observacao);
        return null;
    }

    internal static string? NormalizarNome(string? nome)
    {
        if (string.IsNullOrWhiteSpace(nome)) return null;
        return Espacos.Replace(nome.Trim(), " ");
    }

    private static string? NormalizarCnpj(RegistroFonte r, List<string> observacoes)
    {
        if (string.IsNullOrWhiteSpace(r.Cnpj)) return null;
        var cnpj = new string(r.Cnpj.Where(char.IsLetterOrDigit).ToArray()).ToUpperInvariant();
        if (cnpj.Length == BancoValidator.TamanhoCnpj && DocumentoValidator.ValidarCnpj(cnpj))
            return cnpj;
        observacoes.Add($"CNPJ '{r.Cnpj}' do {r.Fonte} é inválido; campo deixado vazio.");
        return null;
    }

    private static ItemImportacao Item(SituacaoImportacao situacao, string ispb, string fontes, Banco? banco, List<string> motivos, List<string> observacoes)
    {
        var item = new ItemImportacao { Situacao = situacao, Ispb = ispb, Fontes = fontes, Proposto = banco };
        item.Motivos.AddRange(motivos);
        item.Observacoes.AddRange(observacoes);
        return item;
    }

    private static Banco Copiar(Banco b, uint id) => new()
    {
        IdBanco = id,
        CodigoBanco = b.CodigoBanco,
        DigitoVerificador = b.DigitoVerificador,
        Nome = b.Nome,
        ISPB = b.ISPB,
        CNPJ = b.CNPJ,
        Ativo = b.Ativo,
    };
}
