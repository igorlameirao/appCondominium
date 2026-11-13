using System.Linq;
using AppCondominium.Domain.Entities;

namespace AppCondominium.Domain.Validators;

public static class BancoValidator
{
    public const int TamanhoCodigoBanco = 3;
    public const int TamanhoDigitoVerificador = 1;
    public const int TamanhoMaximoNome = 255;
    public const int TamanhoIspb = 8;
    public const int TamanhoCnpj = 14;

    /// <summary>Remove espaços/máscaras e converte opcionais vazios em null. Códigos permanecem texto (zeros à esquerda).</summary>
    public static void Normalizar(Banco banco)
    {
        banco.CodigoBanco = Vazio(banco.CodigoBanco?.Trim());
        banco.DigitoVerificador = Vazio(banco.DigitoVerificador?.Trim().ToUpperInvariant());
        banco.Nome = Vazio(banco.Nome?.Trim());
        banco.ISPB = Vazio(banco.ISPB?.Trim());
        banco.CNPJ = Vazio(banco.CNPJ == null
            ? null
            : new string(banco.CNPJ.Where(char.IsLetterOrDigit).ToArray()).ToUpperInvariant());
        banco.Ativo ??= 1;
    }

    /// <summary>Retorna a primeira violação encontrada ou null quando o registro é válido.</summary>
    public static string? Validar(Banco banco)
    {
        if (banco.CodigoBanco != null && !SomenteDigitos(banco.CodigoBanco, TamanhoCodigoBanco))
            return $"Código Banco deve conter exatamente {TamanhoCodigoBanco} dígitos.";

        if (banco.DigitoVerificador != null
            && (banco.DigitoVerificador.Length != TamanhoDigitoVerificador
                || !(char.IsDigit(banco.DigitoVerificador[0]) || banco.DigitoVerificador[0] == 'X')))
            return "Dígito Verificador deve conter 1 caractere (0-9 ou X).";

        if (banco.Nome == null)
            return "Nome é obrigatório.";
        if (banco.Nome.Length > TamanhoMaximoNome)
            return $"Nome deve conter no máximo {TamanhoMaximoNome} caracteres.";

        if (banco.ISPB == null)
            return "ISPB é obrigatório.";
        if (!SomenteDigitos(banco.ISPB, TamanhoIspb))
            return $"ISPB deve conter exatamente {TamanhoIspb} dígitos.";

        if (banco.CNPJ != null && (banco.CNPJ.Length != TamanhoCnpj || !DocumentoValidator.ValidarCnpj(banco.CNPJ)))
            return "CNPJ inválido.";

        if (banco.Ativo is not (0 or 1))
            return "Ativo deve ser verdadeiro ou falso.";

        return null;
    }

    private static string? Vazio(string? valor) => string.IsNullOrEmpty(valor) ? null : valor;

    private static bool SomenteDigitos(string valor, int tamanho) =>
        valor.Length == tamanho && valor.All(char.IsAsciiDigit);
}
