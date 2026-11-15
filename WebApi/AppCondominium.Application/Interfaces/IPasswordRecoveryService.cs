namespace AppCondominium.Application.Interfaces;

public record SolicitarRecuperacaoSenhaResponse(string Mensagem);

public record ValidarRecuperacaoSenhaResponse(bool Valido, string Codigo, string Mensagem);

public record RedefinirSenhaRecuperacaoRequest(string Token, string SenhaNova);

public record RedefinirSenhaRecuperacaoResponse(bool Sucesso, string Mensagem);

public interface IPasswordRecoveryService
{
    Task<SolicitarRecuperacaoSenhaResponse> SolicitarAsync(string email, CancellationToken ct = default);
    Task<ValidarRecuperacaoSenhaResponse> ValidarTokenAsync(string token, CancellationToken ct = default);
    Task<RedefinirSenhaRecuperacaoResponse> RedefinirAsync(RedefinirSenhaRecuperacaoRequest request, CancellationToken ct = default);
}