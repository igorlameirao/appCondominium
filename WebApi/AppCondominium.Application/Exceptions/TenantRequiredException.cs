namespace AppCondominium.Application.Exceptions;

public class TenantRequiredException : InvalidOperationException
{
    public TenantRequiredException()
        : base("Tenant (IdCondominio) não resolvido para esta operação.")
    {
    }
}
