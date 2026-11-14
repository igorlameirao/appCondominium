import 'package:dio/dio.dart';

import '../../../core/errors/app_failure.dart';
import '../../../core/network/api_exception.dart';

AppFailure mapAuthApiError(DioException error, {required bool duringLogin}) {
  if (_isConnectionIssue(error)) {
    return const NetworkFailure(
      'Não foi possível conectar ao servidor. Verifique a rede e se a API está no ar.',
    );
  }

  final api = error.error;
  if (api is ApiException) {
    final code = api.statusCode;
  final message = api.message.trim();

    if (code == 401) {
      if (duringLogin) {
        return InvalidCredentialsFailure(
          message.isNotEmpty
              ? message
              : 'E-mail ou senha inválidos. Tente novamente.',
        );
      }
      return UnauthorizedFailure(
        message.isNotEmpty ? message : 'Sessão expirada. Faça login novamente.',
      );
    }
    if (code == 403) {
      return ForbiddenFailure(
        message.isNotEmpty ? message : 'Acesso negado a este recurso.',
      );
    }
    if (code != null && code >= 400 && code < 500) {
      return InvalidCredentialsFailure(
        message.isNotEmpty ? message : 'Não foi possível concluir o login.',
      );
    }
  }

  return UnexpectedFailure(
    duringLogin
        ? 'Não foi possível concluir o login. Tente novamente.'
        : 'Ocorreu um erro inesperado.',
  );
}

bool _isConnectionIssue(DioException error) {
  return error.type == DioExceptionType.connectionTimeout ||
      error.type == DioExceptionType.receiveTimeout ||
      error.type == DioExceptionType.sendTimeout ||
      error.type == DioExceptionType.connectionError;
}