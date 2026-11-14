import 'package:dio/dio.dart';

import '../../security/token_storage.dart';

/// Anexa JWT e `X-Id-Condominio` quando a sessão estiver definida.
class AuthInterceptor extends Interceptor {
  AuthInterceptor(this._tokenStorage);

  final TokenStorage _tokenStorage;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _tokenStorage.readAccessToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    final session = await _tokenStorage.readSession();
    if (session != null) {
      options.headers['X-Id-Condominio'] = session.idCondominio.toString();
    }
    handler.next(options);
  }
}