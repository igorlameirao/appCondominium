import 'package:appcondominium_mobile/core/network/interceptors/auth_interceptor.dart';
import 'package:appcondominium_mobile/core/security/secure_key_value_store.dart';
import 'package:appcondominium_mobile/core/security/stored_session.dart';
import 'package:appcondominium_mobile/core/security/token_storage.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

import 'support/fake_jwt.dart';

void main() {
  test('AuthInterceptor envia Bearer e X-Id-Condominio', () async {
    final store = InMemorySecureKeyValueStore();
    final tokenStorage = TokenStorage(store);
    await tokenStorage.persistAuthenticatedSession(
      token: fakeJwt(
        expUnixSeconds: unixSecondsFromNow(const Duration(hours: 1)),
        idCondominio: 99,
      ),
      session: const StoredSession(
        idCondominio: 99,
        nome: 'U',
        perfil: 'Morador',
        acessoTotal: false,
        permissoes: [],
      ),
    );

    final interceptor = AuthInterceptor(tokenStorage);
    late RequestOptions captured;
    await interceptor.onRequest(
      RequestOptions(path: '/api/x'),
      _CapturingHandler((options) => captured = options),
    );

    final token = await tokenStorage.readAccessToken();
    expect(captured.headers['Authorization'], 'Bearer $token');
    expect(captured.headers['X-Id-Condominio'], '99');
  });
}

class _CapturingHandler extends RequestInterceptorHandler {
  _CapturingHandler(this._onNext);

  final void Function(RequestOptions options) _onNext;

  @override
  void next(RequestOptions options) => _onNext(options);
}