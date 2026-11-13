using System.Text;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AppCondominium.Tools.Bancos;

/// <summary>
/// Importação inicial de bancos (JSON BrasilAPI + CSV ParticipantesSTR). Sem <c>--aplicar</c> apenas gera a prévia.
/// Reexecutável: só inclui ISPB e Código Banco ainda livres; nunca altera nem exclui registros existentes.
/// </summary>
public sealed class BancoImportador
{
    private readonly AppDbContext _db;
    private readonly ILogger<BancoImportador> _logger;

    public BancoImportador(AppDbContext db, ILogger<BancoImportador> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<int> RunAsync(string caminhoJson, string caminhoCsv, bool aplicar, string pastaRelatorio, CancellationToken ct)
    {
        var json = BancoFontes.LerJson(caminhoJson);
        var csv = BancoFontes.LerCsv(caminhoCsv);
        var registros = json.Concat(csv).ToList();
        _logger.LogInformation("Fontes lidas: JSON {Json} registros, CSV {Csv} registros.", json.Count, csv.Count);

        var existentes = await CarregarExistentesAsync(ct);
        _logger.LogInformation("Bancos já cadastrados no MySQL: {Total}.", existentes.Count);

        var plano = BancoImportacaoPlanejador.Planejar(registros, existentes);
        if (!BancoImportacaoPlanejador.VerificarIdempotencia(registros, existentes, plano))
            throw new InvalidOperationException("Verificação de idempotência falhou: uma segunda execução proporia novas inclusões.");

        var incluidos = 0;
        if (aplicar && plano.Total(SituacaoImportacao.Incluir) > 0)
        {
            plano = await AplicarAsync(registros, ct);
            incluidos = plano.Total(SituacaoImportacao.Incluir);
            var depois = await CarregarExistentesAsync(ct);
            var pendentes = BancoImportacaoPlanejador.Planejar(registros, depois).Total(SituacaoImportacao.Incluir);
            if (pendentes > 0)
                _logger.LogWarning("Após a gravação ainda restam {Pendentes} inclusões pendentes.", pendentes);
            existentes = depois;
        }

        var arquivo = EscreverRelatorio(pastaRelatorio, caminhoJson, caminhoCsv, json.Count, csv.Count, aplicar, incluidos, existentes.Count, plano);
        ImprimirResumo(plano, aplicar, incluidos, arquivo);
        return 0;
    }

    private Task<List<Banco>> CarregarExistentesAsync(CancellationToken ct) =>
        _db.Banco.IgnoreQueryFilters().AsNoTracking().ToListAsync(ct);

    /// <summary>Replaneja dentro da transação com o estado atual do MySQL antes de inserir.</summary>
    private async Task<PlanoImportacao> AplicarAsync(IReadOnlyList<RegistroFonte> registros, CancellationToken ct)
    {
        var estrategia = _db.Database.CreateExecutionStrategy();
        return await estrategia.ExecuteAsync(async () =>
        {
            _db.ChangeTracker.Clear();
            await using var tx = await _db.Database.BeginTransactionAsync(ct);
            var atuais = await CarregarExistentesAsync(ct);
            var plano = BancoImportacaoPlanejador.Planejar(registros, atuais);
            var novos = plano.Com(SituacaoImportacao.Incluir)
                .Select(i => new Banco
                {
                    CodigoBanco = i.Proposto!.CodigoBanco,
                    DigitoVerificador = i.Proposto.DigitoVerificador,
                    Nome = i.Proposto.Nome,
                    ISPB = i.Proposto.ISPB,
                    CNPJ = i.Proposto.CNPJ,
                    Ativo = 1,
                })
                .ToList();
            _db.Banco.AddRange(novos);
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            _logger.LogInformation("Bancos incluídos: {Total}.", novos.Count);
            return plano;
        });
    }

    private static string EscreverRelatorio(
        string pasta, string caminhoJson, string caminhoCsv, int totalJson, int totalCsv,
        bool aplicar, int incluidos, int existentes, PlanoImportacao plano)
    {
        Directory.CreateDirectory(pasta);
        var carimbo = DateTime.Now.ToString("yyyyMMdd-HHmmss");
        var md = Path.Combine(pasta, $"importacao-bancos-{carimbo}.md");
        var csv = Path.Combine(pasta, $"importacao-bancos-{carimbo}.csv");

        var sb = new StringBuilder();
        sb.AppendLine($"# Importação de bancos — {(aplicar ? "EXECUÇÃO" : "PRÉVIA (nada gravado)")}");
        sb.AppendLine();
        sb.AppendLine($"- Data: {DateTime.Now:dd/MM/yyyy HH:mm:ss}");
        sb.AppendLine($"- JSON: `{caminhoJson}` ({totalJson} registros)");
        sb.AppendLine($"- CSV: `{caminhoCsv}` ({totalCsv} registros)");
        sb.AppendLine($"- Bancos no MySQL {(aplicar ? "após a execução" : "antes da importação")}: {existentes}");
        if (aplicar) sb.AppendLine($"- Incluídos nesta execução: {incluidos}");
        sb.AppendLine();
        sb.AppendLine("| Situação | Quantidade |");
        sb.AppendLine("|---|---:|");
        foreach (var s in Enum.GetValues<SituacaoImportacao>())
            sb.AppendLine($"| {Rotulo(s, aplicar)} | {plano.Total(s)} |");

        foreach (var s in Enum.GetValues<SituacaoImportacao>())
        {
            var itens = plano.Com(s).ToList();
            if (itens.Count == 0) continue;
            sb.AppendLine();
            sb.AppendLine($"## {Rotulo(s, aplicar)} ({itens.Count})");
            sb.AppendLine();
            sb.AppendLine("| Código | ISPB | Nome | Fontes | Motivos / observações |");
            sb.AppendLine("|---|---|---|---|---|");
            foreach (var i in itens)
                sb.AppendLine($"| {i.Proposto?.CodigoBanco ?? "—"} | {i.Ispb} | {Md(i.Proposto?.Nome)} | {i.Fontes} | {Md(string.Join(" ", i.Motivos.Concat(i.Observacoes)))} |");
        }
        File.WriteAllText(md, sb.ToString(), new UTF8Encoding(false));

        var linhas = new StringBuilder("Situacao;IdBancoExistente;CodigoBanco;ISPB;Nome;CNPJ;Fontes;Motivos;Observacoes\n");
        foreach (var i in plano.Itens)
            linhas.AppendLine(string.Join(";", new[]
            {
                i.Situacao.ToString(), i.IdExistente?.ToString() ?? "", i.Proposto?.CodigoBanco ?? "", i.Ispb ?? "",
                i.Proposto?.Nome ?? "", i.Proposto?.CNPJ ?? "", i.Fontes,
                string.Join(" | ", i.Motivos), string.Join(" | ", i.Observacoes),
            }.Select(Csv)));
        File.WriteAllText(csv, linhas.ToString(), new UTF8Encoding(true));
        return md;
    }

    private void ImprimirResumo(PlanoImportacao plano, bool aplicar, int incluidos, string arquivo)
    {
        _logger.LogInformation(
            "{Modo}: a incluir {Incluir}, ignorados {Ignorado}, divergentes {Divergente}, rejeitados {Rejeitado}{Gravados}.",
            aplicar ? "Execução" : "Prévia (nada gravado)",
            plano.Total(SituacaoImportacao.Incluir), plano.Total(SituacaoImportacao.Ignorado),
            plano.Total(SituacaoImportacao.Divergente), plano.Total(SituacaoImportacao.Rejeitado),
            aplicar ? $", gravados {incluidos}" : "");
        _logger.LogInformation("Relatório: {Arquivo}", arquivo);
    }

    private static string Rotulo(SituacaoImportacao s, bool aplicar) => s switch
    {
        SituacaoImportacao.Incluir => aplicar ? "Incluídos" : "A incluir",
        SituacaoImportacao.Ignorado => "Ignorados (já cadastrados, idênticos)",
        SituacaoImportacao.Divergente => "Divergentes (não importados)",
        _ => "Rejeitados",
    };

    private static string Md(string? texto) => (texto ?? "").Replace("|", "\\|");

    private static string Csv(string valor) =>
        valor.IndexOfAny(new[] { ';', '"', '\n' }) >= 0 ? $"\"{valor.Replace("\"", "\"\"")}\"" : valor;
}
