namespace AppCondominium.Domain.Convites;

public static class ConviteAcessoEstado
{
    public const byte Pendente = 1;
    public const byte Aceito = 2;
    public const byte Expirado = 3;
    public const byte Revogado = 4;
}

public static class ConviteTipoConvite
{
    public const byte AtivacaoContaNova = 1;
    public const byte AtivacaoCredencialExistente = 2;
    public const byte VinculoCondominioAdicional = 3;
}

public static class ConviteEnvioEmailEstado
{
    public const byte Pendente = 1;
    public const byte Enviado = 2;
    public const byte Falha = 3;
}