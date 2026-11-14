namespace AppCondominium.API.Middleware;

public enum TenantResolutionStatus
{
    Anonymous,
    Resolved,
    MissingTenant,
    HeaderMismatch
}

public readonly record struct TenantResolutionResult(TenantResolutionStatus Status, uint? TenantId);

/// <summary>
/// Resolve o tenant (IdCondominio) a partir do JWT e do header X-Id-Condominio.
/// </summary>
public static class TenantResolution
{
    public static TenantResolutionResult Resolve(bool isAuthenticated, string? claimValue, string? headerValue)
    {
        if (!isAuthenticated)
            return new TenantResolutionResult(TenantResolutionStatus.Anonymous, null);

        if (!uint.TryParse(claimValue, out var claimId))
            return new TenantResolutionResult(TenantResolutionStatus.MissingTenant, null);

        if (!string.IsNullOrWhiteSpace(headerValue))
        {
            if (!uint.TryParse(headerValue, out var headerId) || headerId != claimId)
                return new TenantResolutionResult(TenantResolutionStatus.HeaderMismatch, claimId);
        }

        return new TenantResolutionResult(TenantResolutionStatus.Resolved, claimId);
    }

    public static bool PathSkipsTenant(PathString path)
    {
        var value = path.Value ?? "";
        return value.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase)
            || value.Equals("/api/auth/login", StringComparison.OrdinalIgnoreCase)
            || value.Equals("/api/auth/vinculos", StringComparison.OrdinalIgnoreCase)
            || value.Equals("/api/auth/condominios", StringComparison.OrdinalIgnoreCase)
            || value.StartsWith("/api/lookup/condominio-por-dominio", StringComparison.OrdinalIgnoreCase)
            || value.StartsWith("/api/lookup/condominio-resumo/", StringComparison.OrdinalIgnoreCase)
            || value.StartsWith("/api/lookup/configuracao-por-condominio/", StringComparison.OrdinalIgnoreCase)
            || value.StartsWith("/api/lookup/condominios/", StringComparison.OrdinalIgnoreCase);
    }
}
