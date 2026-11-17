using AppCondominium.Application.DTOs;
using AppCondominium.Application.Interfaces;
using AppCondominium.Application.Storage;
using AppCondominium.Domain.Entities;
using AppCondominium.Domain.Vinculos;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.Infrastructure.Services;

public class ColaboradorService : IColaboradorService
{
    private readonly AppDbContext _db;
    private readonly ICondominioContext _tenant;
    private readonly IArquivoStorage _arquivos;
    private readonly StorageObjectKeyBuilder _chaves;

    public ColaboradorService(
        AppDbContext db,
        ICondominioContext tenant,
        IArquivoStorage arquivos,
        StorageObjectKeyBuilder chaves)
    {
        _db = db;
        _tenant = tenant;
        _arquivos = arquivos;
        _chaves = chaves;
    }

    public async Task<ColaboradorConsultaDto> ConsultarAsync(uint idPessoa, CancellationToken ct = default)
    {
        var tenantId = _tenant.RequireTenantId();
        var rows = await _db.Colaborador.AsNoTracking()
            .Where(c => c.IdPessoa == idPessoa && c.IdCondominio == tenantId)
            .OrderByDescending(c => c.DataAdmissao)
            .ToListAsync(ct);
        var funcoes = await _db.FuncaoColaborador.AsNoTracking().ToListAsync(ct);
        var nomes = funcoes.ToDictionary(f => f.IdFuncaoColaborador!.Value, f => f.Descricao ?? "");

        var itens = new List<ColaboradorItemDto>();
        foreach (var row in rows)
        {
            var chave = _chaves.CtpsColaborador(tenantId, idPessoa);
            var temArquivo = false;
            try { temArquivo = await _arquivos.ExisteAsync(chave, ct); }
            catch { temArquivo = false; }
            itens.Add(Map(row, nomes, temArquivo && row.DataDesligamento is null));
        }

        return new ColaboradorConsultaDto
        {
            Ativo = itens.FirstOrDefault(i => i.Ativo),
            Historico = itens.Where(i => !i.Ativo).ToList()
        };
    }

    public async Task<uint> GravarAsync(
        uint idPessoa, PessoaContextoGravacaoRequest request, byte tipoColaborador, bool arquivoObrigatorioSeNovo, CancellationToken ct = default)
    {
        var tenantId = _tenant.RequireTenantId();
        await ValidarPessoaFisicaAsync(idPessoa, ct);
        if (request.DataAdmissao is null)
            throw new InvalidOperationException("Data de admissão é obrigatória.");
        if (string.IsNullOrWhiteSpace(request.Ctps))
            throw new InvalidOperationException("CTPS é obrigatória.");
        if (request.IdFuncaoColaborador is null or 0)
            throw new InvalidOperationException("Função de colaborador é obrigatória.");
        var funcaoOk = await _db.FuncaoColaborador.AnyAsync(f => f.IdFuncaoColaborador == request.IdFuncaoColaborador, ct);
        if (!funcaoOk)
            throw new InvalidOperationException("Função de colaborador inexistente.");

        var ativo = await _db.Colaborador
            .FirstOrDefaultAsync(c => c.IdPessoa == idPessoa && c.IdCondominio == tenantId && c.DataDesligamento == null, ct);

        if (ativo is not null && arquivoObrigatorioSeNovo)
            throw new InvalidOperationException("Colaborador(a) já cadastrado(a)");

        if (ativo is null && string.IsNullOrWhiteSpace(request.CtpsArquivoBase64))
            throw new InvalidOperationException("O envio do arquivo da CTPS é obrigatório.");

        if (ativo is null)
        {
            ativo = new Colaborador
            {
                IdPessoa = idPessoa,
                IdCondominio = tenantId,
                DataAdmissao = request.DataAdmissao,
                DataDesligamento = request.DataDesligamento,
                CTPS = request.Ctps.Trim(),
                TipoColaborador = tipoColaborador,
                IdFuncaoColaborador = request.IdFuncaoColaborador
            };
            _db.Colaborador.Add(ativo);
        }
        else
        {
            ativo.DataAdmissao = request.DataAdmissao;
            ativo.DataDesligamento = request.DataDesligamento;
            ativo.CTPS = request.Ctps.Trim();
            ativo.TipoColaborador = tipoColaborador;
            ativo.IdFuncaoColaborador = request.IdFuncaoColaborador;
        }

        await _db.SaveChangesAsync(ct);

        if (!string.IsNullOrWhiteSpace(request.CtpsArquivoBase64))
        {
            var bytes = Decode(request.CtpsArquivoBase64);
            if (bytes.Length == 0 || bytes.Length > StorageMedia.DocumentoMaxBytes)
                throw new InvalidOperationException("Arquivo da CTPS inválido ou maior que o limite.");
            var contentType = StorageMedia.DetectContentType(bytes);
            if (!StorageMedia.Documentos.Contains(contentType))
                throw new InvalidOperationException("A CTPS deve ser PDF, JPEG ou PNG.");
            await using var stream = new MemoryStream(bytes);
            await _arquivos.SalvarSubstituindoAsync(_chaves.CtpsColaborador(tenantId, idPessoa), stream, contentType, ct);
        }
        else if (arquivoObrigatorioSeNovo)
        {
            var existe = await _arquivos.ExisteAsync(_chaves.CtpsColaborador(tenantId, idPessoa), ct);
            if (!existe)
                throw new InvalidOperationException("O envio do arquivo da CTPS é obrigatório.");
        }

        return ativo.IdColaborador!.Value;
    }

    private async Task ValidarPessoaFisicaAsync(uint idPessoa, CancellationToken ct)
    {
        var pf = await _db.Pessoafisica.IgnoreQueryFilters().AnyAsync(p => p.IdPessoa == idPessoa, ct);
        if (!pf)
            throw new InvalidOperationException("O colaborador é a especialização de uma pessoa física.");
    }

    private static ColaboradorItemDto Map(Colaborador row, Dictionary<uint, string> funcoes, bool temArquivo) => new()
    {
        IdColaborador = row.IdColaborador,
        IdPessoa = row.IdPessoa ?? 0,
        DataAdmissao = row.DataAdmissao,
        DataDesligamento = row.DataDesligamento,
        Ctps = row.CTPS,
        TipoColaborador = row.TipoColaborador,
        IdFuncaoColaborador = row.IdFuncaoColaborador,
        FuncaoDescricao = row.IdFuncaoColaborador is uint id ? funcoes.GetValueOrDefault(id) : null,
        Ativo = row.DataDesligamento is null,
        PossuiArquivoCtps = temArquivo
    };

    private static byte[] Decode(string base64)
    {
        var payload = base64.Trim();
        var comma = payload.IndexOf(',');
        if (payload.StartsWith("data:", StringComparison.OrdinalIgnoreCase) && comma >= 0)
            payload = payload[(comma + 1)..];
        return Convert.FromBase64String(payload);
    }
}
