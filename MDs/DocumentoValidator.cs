using System;
using System.Linq;

namespace DocumentoValidators
{
    public static class DocumentoValidator
    {
        #region CPF

        public static bool ValidarCpf(string cpf)
        {
            if (string.IsNullOrWhiteSpace(cpf))
                return false;

            cpf = new string(cpf.Where(char.IsDigit).ToArray());

            if (cpf.Length != 11)
                return false;

            // Elimina CPFs inválidos conhecidos
            if (cpf.Distinct().Count() == 1)
                return false;

            int[] multiplicador1 = { 10, 9, 8, 7, 6, 5, 4, 3, 2 };
            int[] multiplicador2 = { 11, 10, 9, 8, 7, 6, 5, 4, 3, 2 };

            string tempCpf = cpf.Substring(0, 9);

            int soma = 0;

            for (int i = 0; i < 9; i++)
                soma += (tempCpf[i] - '0') * multiplicador1[i];

            int resto = soma % 11;

            int digito1 = resto < 2 ? 0 : 11 - resto;

            tempCpf += digito1;

            soma = 0;

            for (int i = 0; i < 10; i++)
                soma += (tempCpf[i] - '0') * multiplicador2[i];

            resto = soma % 11;

            int digito2 = resto < 2 ? 0 : 11 - resto;

            return cpf.EndsWith($"{digito1}{digito2}");
        }

        #endregion

        #region CNPJ Numérico

        public static bool ValidarCnpjNumerico(string cnpj)
        {
            if (string.IsNullOrWhiteSpace(cnpj))
                return false;

            cnpj = new string(cnpj.Where(char.IsDigit).ToArray());

            if (cnpj.Length != 14)
                return false;

            // Elimina CNPJs inválidos conhecidos
            if (cnpj.Distinct().Count() == 1)
                return false;

            int[] multiplicador1 =
            {
                5, 4, 3, 2,
                9, 8, 7, 6, 5, 4, 3, 2
            };

            int[] multiplicador2 =
            {
                6, 5, 4, 3, 2,
                9, 8, 7, 6, 5, 4, 3, 2
            };

            string tempCnpj = cnpj.Substring(0, 12);

            int soma = 0;

            for (int i = 0; i < 12; i++)
                soma += (tempCnpj[i] - '0') * multiplicador1[i];

            int resto = soma % 11;

            int digito1 = resto < 2 ? 0 : 11 - resto;

            tempCnpj += digito1;

            soma = 0;

            for (int i = 0; i < 13; i++)
                soma += (tempCnpj[i] - '0') * multiplicador2[i];

            resto = soma % 11;

            int digito2 = resto < 2 ? 0 : 11 - resto;

            return cnpj.EndsWith($"{digito1}{digito2}");
        }

        #endregion

        #region CNPJ Alfanumérico

        public static bool ValidarCnpjAlfanumerico(string cnpj)
        {
            if (string.IsNullOrWhiteSpace(cnpj))
                return false;

            Span<char> buffer = stackalloc char[14];

            int pos = 0;

            foreach (char c in cnpj)
            {
                if (char.IsLetterOrDigit(c))
                {
                    if (pos >= 14)
                        return false;

                    buffer[pos++] = char.ToUpperInvariant(c);
                }
            }

            if (pos != 14)
                return false;

            int[] peso1 =
            {
                5, 4, 3, 2,
                9, 8, 7, 6, 5, 4, 3, 2
            };

            int[] peso2 =
            {
                6, 5, 4, 3, 2,
                9, 8, 7, 6, 5, 4, 3, 2
            };

            int soma = 0;

            for (int i = 0; i < 12; i++)
                soma += Valor(buffer[i]) * peso1[i];

            int resto = soma % 11;

            int dv1 = resto < 2 ? 0 : 11 - resto;

            soma = 0;

            for (int i = 0; i < 12; i++)
                soma += Valor(buffer[i]) * peso2[i];

            soma += dv1 * peso2[12];

            resto = soma % 11;

            int dv2 = resto < 2 ? 0 : 11 - resto;

            return buffer[12] == (char)(dv1 + '0')
                && buffer[13] == (char)(dv2 + '0');
        }

        private static int Valor(char c)
        {
            if (char.IsDigit(c))
                return c - '0';

            return c - 'A' + 10;
        }

        #endregion
    }
}
