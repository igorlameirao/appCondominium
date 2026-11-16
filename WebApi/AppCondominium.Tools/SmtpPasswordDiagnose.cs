using System.Security.Cryptography;
using System.Text;
using AppCondominium.Application.Interfaces;
using AppCondominium.Application.DTOs;
using AppCondominium.Domain.Entities;
using AppCondominium.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AppCondominium.Tools;

/// <summary>Diagnóstico temporário: não imprime senha nem chave.</summary>
internal static class SmtpPasswordDiagnose
{
    public static async Task<int> RunAsync(IServiceProvider services, CancellationToken ct)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var protector = scope.ServiceProvider.GetRequiredService<ISmtpSecretProtector>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        var rows = await db.ConfiguracoesEmail.AsNoTracking()
            .OrderBy(e => e.Id)
            .Select(e => new
            {
                e.Id,
                e.Ativo,
                e.ServidorSmtp,
                e.UsuarioSmtp,
                e.SenhaCriptografada,
                e.DataCadastro,
                e.DataAtualizacao
            })
            .ToListAsync(ct);

        Console.WriteLine($"Registros={rows.Count}");
        Console.WriteLine($"Smtp:ProtectionKey presente={!string.IsNullOrWhiteSpace(config["Smtp:ProtectionKey"])}");
        Console.WriteLine($"Jwt:Key tamanho={(config["Jwt:Key"] ?? "").Length}");

        foreach (var e in rows)
        {
            var blob = e.SenhaCriptografada ?? "";
            var prefixo = blob.Length >= 12 ? blob[..12] : blob;
            Console.WriteLine(
                $"Id={e.Id} Ativo={e.Ativo} Host={e.ServidorSmtp} UsuarioLen={(e.UsuarioSmtp ?? "").Length} SenhaLen={blob.Length} Prefixo={prefixo} Cadastro={e.DataCadastro:o} Atualizacao={e.DataAtualizacao:o}");
            try
            {
                var plain = protector.Unprotect(blob);
                Console.WriteLine($"  Unprotect AppCondominium: {(string.IsNullOrEmpty(plain) ? "vazio" : "ok len=" + plain.Length)}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  Unprotect AppCondominium: {ex.GetType().Name}: {ex.Message}");
            }

            if (blob.StartsWith("enc-v2.", StringComparison.Ordinal))
                TentarOutroDominio(blob, config["Jwt:Key"]);
        }

        var configSvc = scope.ServiceProvider.GetRequiredService<IConfiguracaoEmailService>();
        var dto = await configSvc.ObterAsync(ct);
        var (_, senhaFila) = await configSvc.ObterAtivaComSenhaAsync(ct);
        Console.WriteLine($"DTO SenhaConfigurada={dto?.SenhaConfigurada} SenhaRequerAtualizacao={dto?.SenhaRequerAtualizacao}");
        Console.WriteLine($"ObterAtivaComSenha: senha={(string.IsNullOrEmpty(senhaFila) ? "INDISPONÍVEL" : "ok")}");

        var teste = await configSvc.TestarConexaoAsync(ct);
        Console.WriteLine($"TestarConexao: sucesso={teste.Sucesso} msg={teste.Mensagem} ({teste.DuracaoMs}ms)");

        var fila = await db.EmailQueues.AsNoTracking()
            .OrderByDescending(e => e.Id)
            .Take(8)
            .Select(e => new { e.Id, e.Status, e.Tentativas, e.MensagemErro, e.DataCriacao, e.UltimaTentativa })
            .ToListAsync(ct);
        Console.WriteLine($"Fila recente={fila.Count}");
        foreach (var item in fila)
        {
            var msg = item.MensagemErro ?? "";
            if (msg.Length > 240) msg = msg[..240] + "…";
            Console.WriteLine($"  Fila Id={item.Id} Status={item.Status} Tentativas={item.Tentativas} Criacao={item.DataCriacao:o} Ultima={item.UltimaTentativa:o} Erro={msg}");
        }

        return 0;
    }

    private static void TentarOutroDominio(string blob, string? jwt)
    {
        if (string.IsNullOrWhiteSpace(jwt))
        {
            Console.WriteLine("  Sem Jwt:Key para teste cruzado.");
            return;
        }

        foreach (var dominio in new[] { "SCO.Smtp.v2|", "SGE.Smtp.v2|", "AppCondominium.Smtp.v2|" })
        {
            try
            {
                var len = Descriptografar(blob, dominio + jwt);
                Console.WriteLine($"  AES dominio {dominio.TrimEnd('|')}: ok len={len}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  AES dominio {dominio.TrimEnd('|')}: {ex.GetType().Name}");
            }
        }
    }

    private static int Descriptografar(string protectedText, string secretMaterial)
    {
        const int nonceSize = 12;
        const int tagSize = 16;
        var b64 = protectedText["enc-v2.".Length..];
        var packed = Convert.FromBase64String(b64);
        var nonce = packed.AsSpan(0, nonceSize);
        var tag = packed.AsSpan(packed.Length - tagSize, tagSize);
        var ciphertext = packed.AsSpan(nonceSize, packed.Length - nonceSize - tagSize);
        var plaintext = new byte[ciphertext.Length];
        var key = SHA256.HashData(Encoding.UTF8.GetBytes(secretMaterial));
        using var aes = new AesGcm(key, tagSize);
        aes.Decrypt(nonce, ciphertext, tag, plaintext);
        return plaintext.Length;
    }
}
