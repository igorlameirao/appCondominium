sealed class AppFailure {
  const AppFailure(this.message);

  final String message;
}

final class NetworkFailure extends AppFailure {
  const NetworkFailure([super.message = 'Falha de conexão com o servidor.']);
}

final class UnauthorizedFailure extends AppFailure {
  const UnauthorizedFailure([super.message = 'Sessão expirada ou credenciais inválidas.']);
}

final class ForbiddenFailure extends AppFailure {
  const ForbiddenFailure([super.message = 'Você não tem permissão para esta operação.']);
}

final class InvalidCredentialsFailure extends AppFailure {
  const InvalidCredentialsFailure([super.message = 'E-mail ou senha inválidos. Tente novamente.']);
}

final class UnexpectedFailure extends AppFailure {
  const UnexpectedFailure([super.message = 'Ocorreu um erro inesperado.']);
}
