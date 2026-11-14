using System.Reflection;
using Xunit;

namespace AppCondominium.API.Tests;

/// <summary>Garante que os DTOs públicos do AuthController não foram alterados (compatibilidade Angular/Flutter).</summary>
public class AuthContratoCompatibilidadeTests
{
    [Fact]
    public void AuthController_mantem_records_de_request_e_response()
    {
        var type = typeof(AppCondominium.API.Controllers.AuthController);
        AssertRecord(type, "LoginRequest", "Usuario", "Senha", "IdCondominio", "IdPerfil");
        AssertRecord(type, "CredenciaisRequest", "Usuario", "Senha");
        AssertRecord(type, "LoginResponse", "Token", "IdCondominio", "Perfil", "Nome", "AcessoTotal", "Permissoes");
        AssertRecord(type, "TrocarCondominioRequest", "IdCondominio", "IdPerfil");
        AssertRecord(type, "TrocarPerfilRequest", "IdPerfil");
        AssertRecord(type, "MinhaUnidadeItem", "IdUnidade", "Descricao");
    }

    private static void AssertRecord(Type parent, string nestedName, params string[] propNames)
    {
        var nested = parent.GetNestedType(nestedName, BindingFlags.Public);
        Assert.NotNull(nested);
        var props = nested!.GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Select(p => p.Name)
            .ToArray();
        Assert.Equal(propNames, props);
    }
}