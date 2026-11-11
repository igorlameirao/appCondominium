using System.Data;
using System.Data.Common;
using AppCondominium.Application.Storage;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AppCondominium.Tools;

/// <summary>
/// Copia BLOBs ainda presentes no MySQL para o S3. Com --drop-columns, remove as colunas só depois de cada objeto existir.
/// </summary>
public sealed class BlobToS3Migrator
{
    private readonly AppDbContext _db;
    private readonly IArquivoStorage _arquivos;
    private readonly StorageObjectKeyBuilder _chaves;
    private readonly ILogger<BlobToS3Migrator> _logger;

    public BlobToS3Migrator(
        AppDbContext db,
        IArquivoStorage arquivos,
        StorageObjectKeyBuilder chaves,
        ILogger<BlobToS3Migrator> logger)
    {
        _db = db;
        _arquivos = arquivos;
        _chaves = chaves;
        _logger = logger;
    }

    public async Task RunAsync(bool dropColumns, CancellationToken ct)
    {
        var conn = _db.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open)
            await conn.OpenAsync(ct);

        var enviados = 0;
        enviados += await MigrarPessoasAsync(conn, ct);
        enviados += await MigrarConfiguracaoAsync(conn, ct);
        enviados += await MigrarOfertasAsync(conn, ct);
        enviados += await MigrarProcuracoesAsync(conn, ct);
        _logger.LogInformation("Migração concluída. Objetos enviados: {Total}.", enviados);

        if (!dropColumns)
        {
            _logger.LogInformation("Colunas BLOB preservadas. Rode de novo com --drop-columns após validar o bucket.");
            return;
        }

        await DroparSeExisteAsync(conn, "pessoafisica", "Foto", ct);
        await DroparSeExisteAsync(conn, "ConfiguracaoCondominio", "ImagemLogin", ct);
        await DroparSeExisteAsync(conn, "ConfiguracaoCondominio", "ImagemIcone", ct);
        await DroparSeExisteAsync(conn, "OfertaConcorrencia", "DocumentoComprobatorio", ct);
        await DroparSeExisteAsync(conn, "PessoaUnidade", "Procuracao", ct);
        _logger.LogInformation("Colunas BLOB removidas.");
    }

    private async Task<int> MigrarPessoasAsync(DbConnection conn, CancellationToken ct)
    {
        var coluna = await NomeColunaAsync(conn, "pessoafisica", "Foto", ct);
        if (coluna == null)
        {
            _logger.LogInformation("pessoafisica.Foto ausente — nada a migrar.");
            return 0;
        }

        var tabela = coluna.Value.Tabela;
        var n = 0;
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = $"SELECT `IdPessoa`, `{coluna.Value.Coluna}` AS bin FROM `{tabela}` WHERE `{coluna.Value.Coluna}` IS NOT NULL AND OCTET_LENGTH(`{coluna.Value.Coluna}`) > 0";
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        var pendentes = new List<(uint Id, byte[] Bytes)>();
        while (await reader.ReadAsync(ct))
            pendentes.Add((Convert.ToUInt32(reader.GetValue(0)), (byte[])reader.GetValue(1)));
        await reader.DisposeAsync();

        foreach (var (id, bytes) in pendentes)
        {
            await EnviarAsync(_chaves.FotoPerfil(id), bytes, ct);
            n++;
        }
        _logger.LogInformation("Fotos de pessoa física: {N}.", n);
        return n;
    }

    private async Task<int> MigrarConfiguracaoAsync(DbConnection conn, CancellationToken ct)
    {
        var login = await NomeColunaAsync(conn, "ConfiguracaoCondominio", "ImagemLogin", ct);
        var icone = await NomeColunaAsync(conn, "ConfiguracaoCondominio", "ImagemIcone", ct);
        if (login == null && icone == null)
        {
            _logger.LogInformation("Imagens de configuração ausentes — nada a migrar.");
            return 0;
        }

        var tabela = (login ?? icone)!.Value.Tabela;
        var n = 0;
        await using var cmd = conn.CreateCommand();
        var colLogin = login?.Coluna;
        var colIcone = icone?.Coluna;
        cmd.CommandText = $"SELECT `IdCondominio`"
            + (colLogin == null ? "" : $", `{colLogin}`")
            + (colIcone == null ? "" : $", `{colIcone}`")
            + $" FROM `{tabela}`";
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        var linhas = new List<(uint Id, byte[]? Login, byte[]? Icone)>();
        while (await reader.ReadAsync(ct))
        {
            var id = Convert.ToUInt32(reader.GetValue(0));
            byte[]? bLogin = null;
            byte[]? bIcone = null;
            var i = 1;
            if (colLogin != null)
            {
                if (!reader.IsDBNull(i)) bLogin = (byte[])reader.GetValue(i);
                i++;
            }
            if (colIcone != null && !reader.IsDBNull(i))
                bIcone = (byte[])reader.GetValue(i);
            linhas.Add((id, bLogin, bIcone));
        }
        await reader.DisposeAsync();

        foreach (var (id, bLogin, bIcone) in linhas)
        {
            if (bLogin is { Length: > 0 })
            {
                await EnviarAsync(_chaves.ImagemLogin(id), bLogin, ct);
                n++;
            }
            if (bIcone is { Length: > 0 })
            {
                await EnviarAsync(_chaves.ImagemIcone(id), bIcone, ct);
                n++;
            }
        }
        _logger.LogInformation("Imagens de configuração: {N}.", n);
        return n;
    }

    private async Task<int> MigrarOfertasAsync(DbConnection conn, CancellationToken ct)
    {
        var coluna = await NomeColunaAsync(conn, "OfertaConcorrencia", "DocumentoComprobatorio", ct);
        if (coluna == null)
        {
            _logger.LogInformation("OfertaConcorrencia.DocumentoComprobatorio ausente — nada a migrar.");
            return 0;
        }

        var n = 0;
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = $"SELECT `IdOfertaConcorrencia`, `IdCondominio`, `{coluna.Value.Coluna}` FROM `{coluna.Value.Tabela}` WHERE `{coluna.Value.Coluna}` IS NOT NULL AND OCTET_LENGTH(`{coluna.Value.Coluna}`) > 0";
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        var pendentes = new List<(uint Id, uint Condo, byte[] Bytes)>();
        while (await reader.ReadAsync(ct))
            pendentes.Add((Convert.ToUInt32(reader.GetValue(0)), Convert.ToUInt32(reader.GetValue(1)), (byte[])reader.GetValue(2)));
        await reader.DisposeAsync();

        foreach (var (id, condo, bytes) in pendentes)
        {
            await EnviarAsync(_chaves.DocumentoComprobatorio(condo, id), bytes, ct);
            n++;
        }
        _logger.LogInformation("Documentos de oferta: {N}.", n);
        return n;
    }

    private async Task<int> MigrarProcuracoesAsync(DbConnection conn, CancellationToken ct)
    {
        var coluna = await NomeColunaAsync(conn, "PessoaUnidade", "Procuracao", ct);
        if (coluna == null)
        {
            _logger.LogInformation("PessoaUnidade.Procuracao ausente — nada a migrar.");
            return 0;
        }

        var unidade = await NomeTabelaAsync(conn, "Unidade", ct) ?? "Unidade";
        var n = 0;
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = $"""
            SELECT pu.`IdPessoa`, pu.`IdUnidade`, u.`IdCondominio`, pu.`{coluna.Value.Coluna}`
            FROM `{coluna.Value.Tabela}` pu
            INNER JOIN `{unidade}` u ON u.`IdUnidade` = pu.`IdUnidade`
            WHERE pu.`{coluna.Value.Coluna}` IS NOT NULL AND OCTET_LENGTH(pu.`{coluna.Value.Coluna}`) > 0
            """;
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        var pendentes = new List<(uint Pessoa, uint Unidade, uint Condo, byte[] Bytes)>();
        while (await reader.ReadAsync(ct))
        {
            pendentes.Add((
                Convert.ToUInt32(reader.GetValue(0)),
                Convert.ToUInt32(reader.GetValue(1)),
                Convert.ToUInt32(reader.GetValue(2)),
                (byte[])reader.GetValue(3)));
        }
        await reader.DisposeAsync();

        foreach (var (pessoa, unidadeId, condo, bytes) in pendentes)
        {
            await EnviarAsync(_chaves.Procuracao(condo, pessoa, unidadeId), bytes, ct);
            n++;
        }
        _logger.LogInformation("Procurações: {N}.", n);
        return n;
    }

    private async Task EnviarAsync(string radical, byte[] bytes, CancellationToken ct)
    {
        var tipo = StorageMedia.DetectContentType(bytes);
        await using var stream = new MemoryStream(bytes, writable: false);
        await _arquivos.SalvarSubstituindoAsync(radical, stream, tipo, ct);
        if (!await _arquivos.ExisteAsync(radical, ct))
            throw new InvalidOperationException($"Objeto não encontrado no S3 após o envio: {radical}");
    }

    private async Task DroparSeExisteAsync(DbConnection conn, string tabela, string coluna, CancellationToken ct)
    {
        var nome = await NomeColunaAsync(conn, tabela, coluna, ct);
        if (nome == null)
            return;
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = $"ALTER TABLE `{nome.Value.Tabela}` DROP COLUMN `{nome.Value.Coluna}`";
        await cmd.ExecuteNonQueryAsync(ct);
        _logger.LogInformation("DROP {Tabela}.{Coluna}", nome.Value.Tabela, nome.Value.Coluna);
    }

    private async Task<(string Tabela, string Coluna)?> NomeColunaAsync(DbConnection conn, string tabela, string coluna, CancellationToken ct)
    {
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            SELECT TABLE_NAME, COLUMN_NAME
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND LOWER(TABLE_NAME) = LOWER(@tabela)
              AND LOWER(COLUMN_NAME) = LOWER(@coluna)
            LIMIT 1
            """;
        Add(cmd, "@tabela", tabela);
        Add(cmd, "@coluna", coluna);
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        if (!await reader.ReadAsync(ct))
            return null;
        return (reader.GetString(0), reader.GetString(1));
    }

    private async Task<string?> NomeTabelaAsync(DbConnection conn, string tabela, CancellationToken ct)
    {
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            SELECT TABLE_NAME FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER(@tabela)
            LIMIT 1
            """;
        Add(cmd, "@tabela", tabela);
        var valor = await cmd.ExecuteScalarAsync(ct);
        return valor is string s ? s : null;
    }

    private static void Add(DbCommand cmd, string nome, string valor)
    {
        var p = cmd.CreateParameter();
        p.ParameterName = nome;
        p.Value = valor;
        cmd.Parameters.Add(p);
    }
}
