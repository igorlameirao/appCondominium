using AppCondominium.Application.Interfaces;

namespace AppCondominium.Infrastructure.Services;

public class CondominioContext : ICondominioContext
{
    public uint? IdCondominio { get; private set; }

    public void SetCondominio(uint idCondominio) => IdCondominio = idCondominio;

    public void Clear() => IdCondominio = null;
}
