using System.Linq;

namespace AppCondominium.Domain;

/// <summary>
/// Normalização e heurística de identificador de login (e-mail ou CPF).
/// </summary>
public static class UsuarioIdentificador
{
    public static bool PareceEmail(string usuario) =>
        !string.IsNullOrWhiteSpace(usuario) && usuario.Contains('@', StringComparison.Ordinal);

    public static string SomenteDigitos(string valor) =>
        new string(valor.Where(char.IsDigit).ToArray());

    /// <summary>Retorna CPF com 11 dígitos ou null se o valor não tiver exatamente 11 dígitos.</summary>
    public static string? NormalizarCpfOuNull(string usuario)
    {
        if (string.IsNullOrWhiteSpace(usuario))
            return null;
        var digitos = SomenteDigitos(usuario);
        return digitos.Length == 11 ? digitos : null;
    }
}