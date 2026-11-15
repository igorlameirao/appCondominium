using System.Security.Cryptography;
using System.Text;
using AppCondominium.Application.Interfaces;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Configuration;

namespace AppCondominium.Infrastructure.Services;

/// <summary>Protege senhas SMTP (AES-GCM + fallback Data Protection).</summary>
public sealed class SmtpSecretProtector : ISmtpSecretProtector
{
    public const string PayloadPrefix = "enc-v2.";
    private const string DpPurpose = "AppCondominium.ConfiguracaoEmail.SmtpPassword.v1";
    private const int NonceSize = 12;
    private const int TagSize = 16;

    private readonly IDataProtector _dp;
    private readonly IConfiguration _configuration;

    public SmtpSecretProtector(IDataProtectionProvider provider, IConfiguration configuration)
    {
        _dp = provider.CreateProtector(DpPurpose);
        _configuration = configuration;
    }

    public string Protect(string plainText)
    {
        if (string.IsNullOrEmpty(plainText))
            throw new ArgumentException("Senha SMTP não pode ser vazia.", nameof(plainText));

        var key = GetAesKey();
        var nonce = RandomNumberGenerator.GetBytes(NonceSize);
        var plaintext = Encoding.UTF8.GetBytes(plainText);
        var ciphertext = new byte[plaintext.Length];
        var tag = new byte[TagSize];
        using (var aes = new AesGcm(key, TagSize))
            aes.Encrypt(nonce, plaintext, ciphertext, tag);

        var packed = new byte[NonceSize + ciphertext.Length + TagSize];
        Buffer.BlockCopy(nonce, 0, packed, 0, NonceSize);
        Buffer.BlockCopy(ciphertext, 0, packed, NonceSize, ciphertext.Length);
        Buffer.BlockCopy(tag, 0, packed, NonceSize + ciphertext.Length, TagSize);
        return PayloadPrefix + Convert.ToBase64String(packed);
    }

    public string Unprotect(string protectedText)
    {
        if (string.IsNullOrWhiteSpace(protectedText))
            return string.Empty;

        if (protectedText.StartsWith(PayloadPrefix, StringComparison.Ordinal))
            return UnprotectV2(protectedText);

        return _dp.Unprotect(protectedText);
    }

    private string UnprotectV2(string protectedText)
    {
        var b64 = protectedText[PayloadPrefix.Length..];
        var packed = Convert.FromBase64String(b64);
        if (packed.Length < NonceSize + TagSize + 1)
            throw new CryptographicException("Payload SMTP inválido.");

        var nonce = packed.AsSpan(0, NonceSize);
        var tag = packed.AsSpan(packed.Length - TagSize, TagSize);
        var ciphertext = packed.AsSpan(NonceSize, packed.Length - NonceSize - TagSize);
        var plaintext = new byte[ciphertext.Length];
        using (var aes = new AesGcm(GetAesKey(), TagSize))
            aes.Decrypt(nonce, ciphertext, tag, plaintext);
        return Encoding.UTF8.GetString(plaintext);
    }

    private byte[] GetAesKey()
    {
        var secret = _configuration["Smtp:ProtectionKey"];
        if (string.IsNullOrWhiteSpace(secret))
            secret = _configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(secret))
            throw new InvalidOperationException("Jwt:Key ausente — não é possível proteger a senha SMTP.");
        return SHA256.HashData(Encoding.UTF8.GetBytes("AppCondominium.Smtp.v2|" + secret));
    }
}