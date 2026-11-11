using AppCondominium.Application.Interfaces;

namespace AppCondominium.Infrastructure.Services;

public sealed class PasswordHasher : IPasswordHasher
{
    private const int WorkFactor = 10;

    public string Hash(string password)
    {
        if (string.IsNullOrEmpty(password))
            return string.Empty;
        return BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);
    }

    public bool Verify(string password, string stored)
    {
        if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(stored))
            return false;
        if (!stored.StartsWith("$2", StringComparison.Ordinal))
            return false;
        try
        {
            return BCrypt.Net.BCrypt.Verify(password, stored);
        }
        catch
        {
            return false;
        }
    }
}
