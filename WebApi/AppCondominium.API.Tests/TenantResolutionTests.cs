using AppCondominium.API.Middleware;
using Xunit;

namespace AppCondominium.API.Tests;

public class TenantResolutionTests
{
    [Fact]
    public void Anonymous_does_not_require_tenant()
    {
        var result = TenantResolution.Resolve(false, null, "9");
        Assert.Equal(TenantResolutionStatus.Anonymous, result.Status);
        Assert.Null(result.TenantId);
    }

    [Fact]
    public void Authenticated_without_claim_is_missing_tenant()
    {
        var result = TenantResolution.Resolve(true, null, null);
        Assert.Equal(TenantResolutionStatus.MissingTenant, result.Status);
    }

    [Fact]
    public void Header_different_from_claim_is_forbidden()
    {
        var result = TenantResolution.Resolve(true, "1", "2");
        Assert.Equal(TenantResolutionStatus.HeaderMismatch, result.Status);
    }

    [Fact]
    public void Matching_header_resolves_tenant()
    {
        var result = TenantResolution.Resolve(true, "7", "7");
        Assert.Equal(TenantResolutionStatus.Resolved, result.Status);
        Assert.Equal(7u, result.TenantId);
    }

    [Fact]
    public void Auth_login_skips_tenant_requirement()
    {
        Assert.True(TenantResolution.PathSkipsTenant("/api/auth/login"));
        Assert.True(TenantResolution.PathSkipsTenant("/api/auth/vinculos"));
        Assert.True(TenantResolution.PathSkipsTenant("/api/auth/condominios"));
        Assert.True(TenantResolution.PathSkipsTenant("/api/lookup/condominio-por-dominio"));
        Assert.True(TenantResolution.PathSkipsTenant("/api/lookup/condominio-resumo/3"));
        Assert.False(TenantResolution.PathSkipsTenant("/api/auth/trocar-condominio"));
        Assert.False(TenantResolution.PathSkipsTenant("/api/bloco"));
    }
}
