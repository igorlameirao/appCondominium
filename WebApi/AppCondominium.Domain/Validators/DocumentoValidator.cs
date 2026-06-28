using System.Linq;

namespace AppCondominium.Domain.Validators;

public static class DocumentoValidator
{
    public static bool ValidarCpf(string cpf)
    {
        if (string.IsNullOrWhiteSpace(cpf)) return false;
        cpf = new string(cpf.Where(char.IsDigit).ToArray());
        if (cpf.Length != 11) return false;
        if (cpf.Distinct().Count() == 1) return false;

        int[] m1 = { 10, 9, 8, 7, 6, 5, 4, 3, 2 };
        int[] m2 = { 11, 10, 9, 8, 7, 6, 5, 4, 3, 2 };
        var temp = cpf[..9];
        int soma = 0;
        for (int i = 0; i < 9; i++) soma += (temp[i] - '0') * m1[i];
        int d1 = soma % 11 < 2 ? 0 : 11 - soma % 11;
        temp += d1;
        soma = 0;
        for (int i = 0; i < 10; i++) soma += (temp[i] - '0') * m2[i];
        int d2 = soma % 11 < 2 ? 0 : 11 - soma % 11;
        return cpf.EndsWith($"{d1}{d2}");
    }

    public static bool ValidarCnpjNumerico(string cnpj)
    {
        if (string.IsNullOrWhiteSpace(cnpj)) return false;
        cnpj = new string(cnpj.Where(char.IsDigit).ToArray());
        if (cnpj.Length != 14) return false;
        if (cnpj.Distinct().Count() == 1) return false;

        int[] m1 = { 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
        int[] m2 = { 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
        var temp = cnpj[..12];
        int soma = 0;
        for (int i = 0; i < 12; i++) soma += (temp[i] - '0') * m1[i];
        int d1 = soma % 11 < 2 ? 0 : 11 - soma % 11;
        temp += d1;
        soma = 0;
        for (int i = 0; i < 13; i++) soma += (temp[i] - '0') * m2[i];
        int d2 = soma % 11 < 2 ? 0 : 11 - soma % 11;
        return cnpj.EndsWith($"{d1}{d2}");
    }

    public static bool ValidarCnpjAlfanumerico(string cnpj)
    {
        if (string.IsNullOrWhiteSpace(cnpj)) return false;
        Span<char> buffer = stackalloc char[14];
        int pos = 0;
        foreach (char c in cnpj)
        {
            if (char.IsLetterOrDigit(c))
            {
                if (pos >= 14) return false;
                buffer[pos++] = char.ToUpperInvariant(c);
            }
        }
        if (pos != 14) return false;

        int[] p1 = { 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
        int[] p2 = { 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
        int soma = 0;
        for (int i = 0; i < 12; i++) soma += Valor(buffer[i]) * p1[i];
        int dv1 = soma % 11 < 2 ? 0 : 11 - soma % 11;
        soma = 0;
        for (int i = 0; i < 12; i++) soma += Valor(buffer[i]) * p2[i];
        soma += dv1 * p2[12];
        int dv2 = soma % 11 < 2 ? 0 : 11 - soma % 11;
        return buffer[12] == (char)(dv1 + '0') && buffer[13] == (char)(dv2 + '0');
    }

    public static bool ValidarCnpj(string cnpj)
    {
        if (string.IsNullOrWhiteSpace(cnpj)) return false;
        var raw = new string(cnpj.Where(char.IsLetterOrDigit).ToArray());
        if (raw.All(char.IsDigit)) return ValidarCnpjNumerico(raw);
        return ValidarCnpjAlfanumerico(raw);
    }

    private static int Valor(char c) => char.IsDigit(c) ? c - '0' : c - 'A' + 10;
}
