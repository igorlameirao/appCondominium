namespace AppCondominium.Application.DTOs;

/// <summary>Restringe alteração cadastral ao reutilizar Pessoa existente (ex.: RN-Fornecedor 03).</summary>
public enum PessoaCadastroModo
{
    Completo = 0,
    ReutilizacaoPessoaExistente = 1
}