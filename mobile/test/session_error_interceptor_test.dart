import 'package:appcondominium_mobile/app/bootstrap.dart';
import 'package:appcondominium_mobile/app/theme/theme_mode_controller.dart';
import 'package:appcondominium_mobile/core/config/app_config.dart';
import 'package:appcondominium_mobile/core/config/environment.dart';
import 'package:appcondominium_mobile/core/network/api_exception.dart';
import 'package:appcondominium_mobile/core/network/interceptors/session_error_interceptor.dart';
import 'package:appcondominium_mobile/core/security/secure_key_value_store.dart';
import 'package:appcondominium_mobile/core/security/stored_session.dart';
import 'package:appcondominium_mobile/core/security/token_storage.dart';
import 'package:appcondominium_mobile/features/auth/application/auth_session_notifier.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'support/fake_jwt.dart';

const _session = StoredSession(
  idCondominio: 1,
  nome: 'U',
  perfil: 'Morador',
  acessoTotal: false,
  permissoes: [],
);

Future<ProviderContainer> _container(TokenStorage storage) async {
  SharedPreferences.setMockInitialValues({});
  final prefs = await SharedPreferences.getInstance();
  return ProviderContainer(
    overrides: [
      tokenStorageProvider.overrideWithValue(storage),
      sharedPreferencesProvider.overrideWithValue(prefs),
      appConfigProvider.overrideWithValue(
        const AppConfig(
          environment: AppEnvironment.development,
          apiBaseUrl: 'http://localhost:5000',
          enableApiLogging: false,
        ),
      ),
    ],
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('401 em rota autenticada desloga sessão', () async {
    final storage = TokenStorage(InMemorySecureKeyValueStore());
    final container = await _container(storage);
    addTearDown(container.dispose);

    final token = fakeJwt(
      expUnixSeconds: unixSecondsFromNow(const Duration(hours: 1)),
      idCondominio: 1,
    );
    await storage.persistAuthenticatedSession(token: token, session: _session);
    await container.read(authSessionProvider.notifier).restore();

    final notifier = container.read(authSessionProvider.notifier);
    final interceptor = SessionErrorInterceptor(notifier);

    final err = DioException(
      requestOptions: RequestOptions(path: '/api/bloco'),
      response: Response(
        requestOptions: RequestOptions(path: '/api/bloco'),
        statusCode: 401,
      ),
      error: ApiException(statusCode: 401, message: 'expirado'),
    );

    await interceptor.onError(err, _PassthroughHandler());
    expect(container.read(authSessionProvider).isAuthenticated, isFalse);
    expect(container.read(authSessionProvider).sessionExpiredNotice, isTrue);
  });

  test('401 em login não altera sessão via interceptor', () async {
    final storage = TokenStorage(InMemorySecureKeyValueStore());
    final container = await _container(storage);
    addTearDown(container.dispose);

    final token = fakeJwt(
      expUnixSeconds: unixSecondsFromNow(const Duration(hours: 1)),
      idCondominio: 1,
    );
    await storage.persistAuthenticatedSession(token: token, session: _session);
    await container.read(authSessionProvider.notifier).restore();

    final interceptor =
        SessionErrorInterceptor(container.read(authSessionProvider.notifier));

    final err = DioException(
      requestOptions: RequestOptions(path: '/api/auth/login'),
      response: Response(
        requestOptions: RequestOptions(path: '/api/auth/login'),
        statusCode: 401,
      ),
    );

    await interceptor.onError(err, _PassthroughHandler());
    expect(container.read(authSessionProvider).isAuthenticated, isTrue);
  });

  test('403 não desloga', () async {
    final storage = TokenStorage(InMemorySecureKeyValueStore());
    final container = await _container(storage);
    addTearDown(container.dispose);

    final token = fakeJwt(
      expUnixSeconds: unixSecondsFromNow(const Duration(hours: 1)),
      idCondominio: 1,
    );
    await storage.persistAuthenticatedSession(token: token, session: _session);
    await container.read(authSessionProvider.notifier).restore();

    final interceptor =
        SessionErrorInterceptor(container.read(authSessionProvider.notifier));

    final err = DioException(
      requestOptions: RequestOptions(path: '/api/bloco'),
      response: Response(
        requestOptions: RequestOptions(path: '/api/bloco'),
        statusCode: 403,
      ),
    );

    await interceptor.onError(err, _PassthroughHandler());
    expect(container.read(authSessionProvider).isAuthenticated, isTrue);
  });
}

class _PassthroughHandler extends ErrorInterceptorHandler {
  @override
  void next(DioException err) {}
}