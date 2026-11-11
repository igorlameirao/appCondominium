namespace AppCondominium.Application.Interfaces;

/// <summary>
/// Tenant ativo da requisição. O tenant é o condomínio (<see cref="IdCondominio"/>).
/// </summary>
public interface ICondominioContext
{
    /// <summary>Identificador do tenant (Condominio.IdCondominio).</summary>
    uint? IdCondominio { get; }

    /// <summary>Alias de <see cref="IdCondominio"/>.</summary>
    uint? TenantId => IdCondominio;

    bool IsTenantResolved => IdCondominio.HasValue;

    void SetCondominio(uint idCondominio);
    void Clear();

    /// <summary>Tenant obrigatório em operações isoladas por condomínio.</summary>
    uint RequireTenantId();
}
