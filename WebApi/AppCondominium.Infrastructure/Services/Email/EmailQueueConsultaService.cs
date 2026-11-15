using System.Net;
using System.Text.RegularExpressions;
using AppCondominium.Application.Common;
using AppCondominium.Application.DTOs;
using AppCondominium.Application.Interfaces;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AppCondominium.Infrastructure.Services.Email;

public sealed class EmailQueueConsultaService : IEmailQueueConsultaService
{
    private static readonly HashSet<string> StatusValidos = new(StringComparer.OrdinalIgnoreCase)
    {
        EmailQueueStatus.Pendente, EmailQueueStatus.Enviando, EmailQueueStatus.Enviado, EmailQueueStatus.Erro
    };

    private readonly AppDbContext _db;
    private readonly IEmailService _email;
    private readonly IEmailQueuePump _pump;

    public EmailQueueConsultaService(AppDbContext db, IEmailService email, IEmailQueuePump pump)
    {
        _db = db;
        _email = email;
        _pump = pump;
    }

    public async Task<PagedResult<EmailQueueListItemDto>> SearchPagedAsync(
        int page, int pageSize, EmailQueueFiltroDto filtro, CancellationToken ct = default)
    {
        if (page < 1) page = 1;
        pageSize = Math.Clamp(pageSize, 1, 100);

        var q = Filtrar(_db.EmailQueues.AsNoTracking(), filtro);
        var total = await q.CountAsync(ct);
        var rows = await q.OrderByDescending(e => e.DataCriacao).ThenByDescending(e => e.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync(ct);
        var items = rows.Select(ToListItem).ToList();

        return new PagedResult<EmailQueueListItemDto> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<EmailQueueDetalheDto?> GetByIdAsync(long id, CancellationToken ct = default)
    {
        var e = await _db.EmailQueues.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (e == null) return null;
        var dto = ToListItem(e);
        return new EmailQueueDetalheDto
        {
            Id = dto.Id,
            Destinatario = dto.Destinatario,
            Assunto = dto.Assunto,
            Status = dto.Status,
            Tentativas = dto.Tentativas,
            UltimaTentativa = dto.UltimaTentativa,
            MensagemErro = dto.MensagemErro,
            DataCriacao = dto.DataCriacao,
            DataEnvio = dto.DataEnvio,
            CorpoPreview = MontarPreview(e.Corpo, e.CorpoHtml)
        };
    }

    public async Task<EmailQueueReprocessarResultadoDto> ReprocessarAsync(long id, CancellationToken ct = default)
    {
        var row = await _db.EmailQueues.FirstOrDefaultAsync(e => e.Id == id, ct);
        if (row == null)
            return new() { Ok = false, Mensagem = "E-mail não encontrado na fila." };
        if (row.Status == EmailQueueStatus.Enviado)
            return new() { Ok = false, Mensagem = "Este e-mail já foi enviado.", Item = ToListItem(row) };

        row.Status = EmailQueueStatus.Pendente;
        row.MensagemErro = null;
        await _db.SaveChangesAsync(ct);
        _pump.Pulse();

        try { await _email.ProcessarFilaPorIdsAsync(new[] { id }, ct); }
        catch { /* status gravado pelo EmailService */ }

        var atual = await _db.EmailQueues.AsNoTracking().FirstOrDefaultAsync(e => e.Id == id, ct);
        var item = atual == null ? ToListItem(row) : ToListItem(atual);
        var ok = item.Status == EmailQueueStatus.Enviado;
        return new()
        {
            Ok = ok,
            Mensagem = ok ? "E-mail enviado com sucesso." : (item.MensagemErro ?? "Não foi possível enviar."),
            Item = item
        };
    }

    public async Task<EmailQueueReprocessarResultadoDto> ResetarTentativasAsync(long id, CancellationToken ct = default)
    {
        var row = await _db.EmailQueues.FirstOrDefaultAsync(e => e.Id == id, ct);
        if (row == null) return new() { Ok = false, Mensagem = "E-mail não encontrado na fila." };
        if (row.Status != EmailQueueStatus.Erro)
            return new() { Ok = false, Mensagem = "Só é possível zerar tentativas de e-mails com falha.", Item = ToListItem(row) };

        row.Tentativas = 0;
        row.Status = EmailQueueStatus.Pendente;
        row.MensagemErro = null;
        await _db.SaveChangesAsync(ct);
        _pump.Pulse();
        return new() { Ok = true, Mensagem = "Tentativas zeradas. O sistema tentará enviar novamente.", Item = ToListItem(row) };
    }

    private static IQueryable<EmailQueue> Filtrar(IQueryable<EmailQueue> q, EmailQueueFiltroDto filtro)
    {
        var status = (filtro.Status ?? "").Trim();
        if (!string.IsNullOrEmpty(status))
        {
            var norm = status switch
            {
                "Processando" or "processando" => EmailQueueStatus.Enviando,
                "Falha" or "falha" or "Erro" => EmailQueueStatus.Erro,
                _ => status
            };
            if (StatusValidos.Contains(norm))
                q = q.Where(e => e.Status == norm);
        }

        var dest = (filtro.Destinatario ?? "").Trim();
        if (!string.IsNullOrEmpty(dest)) q = q.Where(e => e.Destinatario.Contains(dest));

        var assunto = (filtro.Assunto ?? "").Trim();
        if (!string.IsNullOrEmpty(assunto)) q = q.Where(e => e.Assunto.Contains(assunto));

        if (filtro.DataInicio is { } di)
            q = q.Where(e => e.DataCriacao >= di.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc));
        if (filtro.DataFim is { } df)
            q = q.Where(e => e.DataCriacao < df.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc));

        return q;
    }

    private static EmailQueueListItemDto ToListItem(EmailQueue e) => new()
    {
        Id = e.Id,
        Destinatario = e.Destinatario,
        Assunto = e.Assunto,
        Status = e.Status,
        Tentativas = e.Tentativas,
        UltimaTentativa = e.UltimaTentativa,
        MensagemErro = e.MensagemErro,
        DataCriacao = e.DataCriacao,
        DataEnvio = e.DataEnvio
    };

    public static string MontarPreview(string? corpo, bool html)
    {
        var s = corpo ?? "";
        s = Regex.Replace(s, @"(token=)[^&\s""']+", "$1***", RegexOptions.IgnoreCase);
        if (html)
        {
            s = Regex.Replace(s, "<[^>]+>", " ");
            s = WebUtility.HtmlDecode(s);
        }
        s = Regex.Replace(s, @"\s+", " ").Trim();
        return s.Length <= 800 ? s : s[..800] + "…";
    }
}