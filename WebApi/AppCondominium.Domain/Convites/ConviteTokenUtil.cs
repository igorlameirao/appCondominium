using System.Security.Cryptography;
using System.Text;

namespace AppCondominium.Domain.Convites;

public static class ConviteTokenUtil
{
  public static string GerarToken()
  {
    Span<byte> bytes = stackalloc byte[32];
    RandomNumberGenerator.Fill(bytes);
    return Convert.ToBase64String(bytes)
        .TrimEnd('=')
        .Replace('+', '-')
        .Replace('/', '_');
  }

  public static string HashToken(string token)
  {
    var hash = SHA256.HashData(Encoding.UTF8.GetBytes(token));
    return Convert.ToHexString(hash).ToLowerInvariant();
  }
}