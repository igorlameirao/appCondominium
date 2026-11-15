namespace AppCondominium.Domain.Entities;

public static class EmailProvedorCodes
{
    public const string AmazonSesSmtp = "AmazonSesSmtp";
    public const string SmtpGenerico = "SmtpGenerico";

    public static bool IsKnown(string? code) =>
        string.Equals(code, AmazonSesSmtp, StringComparison.OrdinalIgnoreCase)
        || string.Equals(code, SmtpGenerico, StringComparison.OrdinalIgnoreCase);
}