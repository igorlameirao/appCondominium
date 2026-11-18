using AppCondominium.Application.DTOs;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Domain.Notificacoes;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.Infrastructure.Services;

public class PreferenciaNotificacaoService : IPreferenciaNotificacaoService
{
    private readonly AppDbContext _db;

    public PreferenciaNotificacaoService(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<PreferenciaNotificacaoItemDto>> ListarAsync(uint idPessoa, CancellationToken ct = default)
    {
        var gravados = await _db.PessoaPreferenciaNotificacao.AsNoTracking()
            .Where(p => p.IdPessoa == idPessoa)
            .ToDictionaryAsync(p => p.CodigoTipo, StringComparer.Ordinal, ct);

        return MontarLista(gravados);
    }

    public async Task<IReadOnlyList<PreferenciaNotificacaoItemDto>> SalvarAsync(
        uint idPessoa,
        IReadOnlyList<PreferenciaNotificacaoAtualizacaoDto> preferencias,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(preferencias);
        if (preferencias.Count == 0)
            throw new InvalidOperationException("Informe ao menos uma preferência.");

        var codigosEnviados = new HashSet<string>(StringComparer.Ordinal);
        foreach (var item in preferencias)
        {
            if (string.IsNullOrWhiteSpace(item.CodigoTipo))
                throw new InvalidOperationException("Código do tipo de notificação é obrigatório.");
            var codigo = item.CodigoTipo.Trim();
            if (!codigosEnviados.Add(codigo))
                throw new InvalidOperationException($"Tipo de notificação duplicado: {codigo}.");

            var definicao = NotificacaoTipoCatalogo.Obter(codigo)
                ?? throw new InvalidOperationException($"Tipo de notificação inválido: {codigo}.");

            ValidarCanais(definicao, item);
        }

        var agora = DateTime.UtcNow;
        var existentes = await _db.PessoaPreferenciaNotificacao
            .Where(p => p.IdPessoa == idPessoa && codigosEnviados.Contains(p.CodigoTipo))
            .ToDictionaryAsync(p => p.CodigoTipo, StringComparer.Ordinal, ct);

        foreach (var item in preferencias)
        {
            var codigo = item.CodigoTipo.Trim();
            var definicao = NotificacaoTipoCatalogo.Exigir(codigo);
            var ativoPush = item.AtivoPush;
            var ativoEmail = item.AtivoEmail;
            if (!definicao.PushDisponivel)
                ativoPush = definicao.PadraoPush;
            if (!definicao.EmailDisponivel)
                ativoEmail = definicao.PadraoEmail;

            if (existentes.TryGetValue(codigo, out var row))
            {
                row.AtivoPush = ativoPush;
                row.AtivoEmail = ativoEmail;
                row.DataAtualizacao = agora;
            }
            else
            {
                _db.PessoaPreferenciaNotificacao.Add(new PessoaPreferenciaNotificacao
                {
                    IdPessoa = idPessoa,
                    CodigoTipo = codigo,
                    AtivoPush = ativoPush,
                    AtivoEmail = ativoEmail,
                    DataAtualizacao = agora
                });
            }
        }

        await _db.SaveChangesAsync(ct);

        var gravados = await _db.PessoaPreferenciaNotificacao.AsNoTracking()
            .Where(p => p.IdPessoa == idPessoa)
            .ToDictionaryAsync(p => p.CodigoTipo, StringComparer.Ordinal, ct);

        return MontarLista(gravados);
    }

    public async Task<bool> CanalAtivoAsync(uint idPessoa, string codigoTipo, NotificacaoCanal canal, CancellationToken ct = default)
    {
        var definicao = NotificacaoTipoCatalogo.Obter(codigoTipo);
        if (definicao is null)
            return false;

        return canal switch
        {
            NotificacaoCanal.Push when !definicao.PushDisponivel => false,
            NotificacaoCanal.Email when !definicao.EmailDisponivel => false,
            _ => await ObterValorCanalAsync(idPessoa, definicao, canal, ct)
        };
    }

    private static void ValidarCanais(NotificacaoTipoDefinicao definicao, PreferenciaNotificacaoAtualizacaoDto item)
    {
        if (definicao.Obrigatoria)
        {
            if (!item.AtivoPush || !item.AtivoEmail)
                throw new InvalidOperationException(
                    $"A categoria \"{definicao.Descricao}\" é obrigatória e não pode ser desativada.");
        }

        if (!definicao.PushDisponivel && item.AtivoPush != definicao.PadraoPush)
            throw new InvalidOperationException($"O canal Push não está disponível para \"{definicao.Descricao}\".");

        if (!definicao.EmailDisponivel && item.AtivoEmail != definicao.PadraoEmail)
            throw new InvalidOperationException($"O canal E-mail não está disponível para \"{definicao.Descricao}\".");
    }

    private async Task<bool> ObterValorCanalAsync(
        uint idPessoa, NotificacaoTipoDefinicao definicao, NotificacaoCanal canal, CancellationToken ct)
    {
        var gravado = await _db.PessoaPreferenciaNotificacao.AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdPessoa == idPessoa && p.CodigoTipo == definicao.Codigo, ct);

        if (gravado is null)
        {
            return canal switch
            {
                NotificacaoCanal.Push => definicao.PadraoPush,
                NotificacaoCanal.Email => definicao.PadraoEmail,
                _ => false
            };
        }

        return canal switch
        {
            NotificacaoCanal.Push => gravado.AtivoPush,
            NotificacaoCanal.Email => gravado.AtivoEmail,
            _ => false
        };
    }

    private static IReadOnlyList<PreferenciaNotificacaoItemDto> MontarLista(
        IReadOnlyDictionary<string, PessoaPreferenciaNotificacao> gravados)
    {
        return NotificacaoTipoCatalogo.Todos
            .OrderBy(t => t.Modulo, StringComparer.Ordinal)
            .ThenBy(t => t.Ordem)
            .Select(def =>
            {
                gravados.TryGetValue(def.Codigo, out var row);
                var ativoPush = row?.AtivoPush ?? def.PadraoPush;
                var ativoEmail = row?.AtivoEmail ?? def.PadraoEmail;
                return new PreferenciaNotificacaoItemDto(
                    def.Codigo,
                    def.Descricao,
                    def.Modulo,
                    def.Ordem,
                    def.Obrigatoria,
                    def.PushDisponivel,
                    def.EmailDisponivel,
                    ativoPush,
                    ativoEmail);
            })
            .ToList();
    }
}