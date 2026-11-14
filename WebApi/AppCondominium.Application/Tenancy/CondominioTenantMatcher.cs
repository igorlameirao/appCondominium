namespace AppCondominium.Application.Tenancy;

/// <summary>
/// RT-Gerais 13 — resolve o condomínio pelo identificador de URL (campo Dominio) ou, legado, pelo host.
/// </summary>
public static class CondominioTenantMatcher
{
    public static string NormalizeSlug(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "";
        return value.Trim().ToLowerInvariant();
    }

    public static string NormalizeHost(string? host)
    {
        if (string.IsNullOrWhiteSpace(host))
            return "";
        var h = host.Trim().ToLowerInvariant();
        if (h.StartsWith("http://", StringComparison.Ordinal))
            h = h[7..];
        else if (h.StartsWith("https://", StringComparison.Ordinal))
            h = h[8..];
        var path = h.IndexOf('/');
        if (path >= 0)
            h = h[..path];
        var colon = h.IndexOf(':');
        if (colon > 0)
            h = h[..colon];
        if (h.StartsWith("www."))
            h = h[4..];
        return h;
    }

    public static bool SlugMatches(string slug, string? dominio)
    {
        var s = NormalizeSlug(slug);
        var d = NormalizeSlug(dominio);
        return !string.IsNullOrEmpty(s) && s == d;
    }

    public static bool HostCorrespondeDominio(string host, string? dominio)
    {
        var h = NormalizeHost(host);
        var d = NormalizeHost(dominio);
        if (string.IsNullOrEmpty(h) || string.IsNullOrEmpty(d))
            return false;
        if (h == d)
            return true;
        return h.StartsWith(d + ".", StringComparison.Ordinal);
    }
}