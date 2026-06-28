namespace AppCondominium.Application.Interfaces;

/// <summary>
/// RT-Gerais 12 (Regra de Ouro): contexto do condomínio selecionado no login.
/// </summary>
public interface ICondominioContext
{
    uint? IdCondominio { get; }
    void SetCondominio(uint idCondominio);
    void Clear();
}
