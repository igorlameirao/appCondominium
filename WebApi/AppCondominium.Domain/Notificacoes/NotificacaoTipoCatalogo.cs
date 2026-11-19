namespace AppCondominium.Domain.Notificacoes;

public sealed record NotificacaoTipoDefinicao(
    string Codigo,
    string Descricao,
    string Modulo,
    int Ordem,
    bool Obrigatoria,
    bool PushDisponivel,
    bool EmailDisponivel,
    bool PadraoPush,
    bool PadraoEmail);

/// <summary>Catálogo de categorias de notificação (sem tabela no banco).</summary>
public static class NotificacaoTipoCatalogo
{
    public static readonly NotificacaoTipoDefinicao[] Todos =
    [
        Def("ENCOMENDA_RECEBIDA", "Encomenda recebida", "Encomendas", 10, false, true, true, true, true),
        Def("ENCOMENDA_RETIRADA", "Encomenda retirada", "Encomendas", 20, false, true, true, true, true),
    ];

    public static NotificacaoTipoDefinicao? Obter(string? codigo) =>
        Todos.FirstOrDefault(t => string.Equals(t.Codigo, codigo, StringComparison.Ordinal));

    public static NotificacaoTipoDefinicao Exigir(string codigo) =>
        Obter(codigo) ?? throw new InvalidOperationException("Tipo de notificação desconhecido.");

    private static NotificacaoTipoDefinicao Def(
        string codigo, string descricao, string modulo, int ordem, bool obrigatoria,
        bool pushDisponivel, bool emailDisponivel, bool padraoPush, bool padraoEmail) =>
        new(codigo, descricao, modulo, ordem, obrigatoria, pushDisponivel, emailDisponivel, padraoPush, padraoEmail);
}