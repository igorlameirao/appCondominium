import 'package:dio/dio.dart';

import '../../../features/auth/application/auth_session_notifier.dart';
import '../api_exception.dart';

/// Distingue 401 (sessão inválida) de 403 (acesso negado com sessão válida).
class SessionErrorInterceptor extends Interceptor {
  SessionErrorInterceptor(this._notifier);

  final AuthSessionNotifier _notifier;

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final status = err.response?.statusCode;
  if (status == 401 && _isAuthenticatedRoute(err.requestOptions)) {
      final api = err.error;
      final isLogin = _isAuthLoginPath(err.requestOptions.path);
      if (!isLogin) {
        await _notifier.handleUnauthorizedFromApi();
      } else if (api is ApiException) {
        // mantém mapeamento no repositório de login
      }
    }
    handler.next(err);
  }

  bool _isAuthenticatedRoute(RequestOptions options) {
    final path = options.path;
    return !path.contains('/api/auth/login') && !path.contains('/api/auth/vinculos');
  }

  bool _isAuthLoginPath(String path) =>
      path.contains('/api/auth/login') || path.contains('/api/auth/vinculos');
}