using AppCondominium.Application.Convites;

namespace AppCondominium.Application.Interfaces;

public record EmitirConviteRequest(
    string Email,
    string? Cpf,
    uint CodigoPapelVinculo,
    uint? IdPerfil,
    uint? IdUnidade,
    uint? IdPessoaRelacionada,
    uint? IdPessoaDestinatario,
    string? Observacao);

public record ConviteListItemDto(
    uint IdConvite,
    string EmailMascarado,
    string? CpfMascarado,
    byte TipoConvite,
    byte Estado,
    byte EstadoEnvioEmail,
    DateTime DataEmissao,
    DateTime DataExpiracao,
    DateTime? DataAceite,
    string? NomeCondominio,
    uint? IdVinculoCriado);

public record EmitirConviteResponse(
    uint IdConvite,
    byte EstadoEnvioEmail,
    string Mensagem);

public record ValidarConviteResponse(
    bool Valido,
    string Codigo,
    string Mensagem,
    byte? TipoConvite,
    bool RequerAutenticacao,
    bool RequerDefinirSenha,
    string? NomeCondominio,
    string? EmailMascarado,
    DateTime? DataExpiracao,
    uint? IdConvite);

public record AceitarConviteContaNovaRequest(
    string Token,
    string Nome,
    string Cpf,
    string Email,
    DateOnly DataNascimento,
    string Senha,
    string? Telefone);

public record AceitarConviteAutenticadoRequest(string Token);

public record AceitarConviteResponse(
    bool Sucesso,
    string Mensagem,
    uint? IdCondominio,
    uint? IdVinculoCriado);

public interface IConviteAcessoService
{
    Task<EmitirConviteResponse> EmitirAsync(uint idPessoaEmissor, EmitirConviteRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<ConviteListItemDto>> ListarAsync(uint idCondominio, string? filtroEmail, CancellationToken ct = default);
    Task<EmitirConviteResponse> ReenviarAsync(uint idConvite, uint idPessoaEmissor, CancellationToken ct = default);
    Task RevogarAsync(uint idConvite, uint idPessoaEmissor, CancellationToken ct = default);
    Task<ValidarConviteResponse> ValidarTokenAsync(string token, CancellationToken ct = default);
    Task<AceitarConviteResponse> AceitarContaNovaAsync(AceitarConviteContaNovaRequest request, CancellationToken ct = default);
    Task<AceitarConviteResponse> AceitarAutenticadoAsync(uint idPessoaAutenticada, AceitarConviteAutenticadoRequest request, CancellationToken ct = default);
    Task ProcessarEnviosPendentesAsync(CancellationToken ct = default);
}