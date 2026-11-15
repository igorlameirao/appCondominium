namespace AppCondominium.Application.Exceptions;

/// <summary>Violação de unicidade ou de integridade referencial que deve ser devolvida como 409.</summary>
public class RegistroConflitanteException : InvalidOperationException
{
    public RegistroConflitanteException(string message, Exception? inner = null)
        : base(message, inner)
    {
    }
}
