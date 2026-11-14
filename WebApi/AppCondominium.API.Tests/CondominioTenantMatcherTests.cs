using AppCondominium.Application.Tenancy;
using Xunit;

namespace AppCondominium.API.Tests;

public class CondominioTenantMatcherTests
{
    [Theory]
    [InlineData("Residencial-Verde", "residencial-verde", true)]
    [InlineData("outro", "residencial-verde", false)]
    [InlineData("  ABC  ", "abc", true)]
    public void SlugMatches_identificador_url(string slug, string dominio, bool esperado)
    {
        Assert.Equal(esperado, CondominioTenantMatcher.SlugMatches(slug, dominio));
    }

    [Theory]
    [InlineData("meucond.appcondominium.com.br", "meucond.appcondominium.com.br", true)]
    [InlineData("meucond.appcondominium.com.br", "sistema.local", false)]
    [InlineData("sistema.local.127.0.0.1", "sistema.local", true)]
    public void HostCorrespondeDominio_legado(string host, string dominio, bool esperado)
    {
        Assert.Equal(esperado, CondominioTenantMatcher.HostCorrespondeDominio(host, dominio));
    }
}