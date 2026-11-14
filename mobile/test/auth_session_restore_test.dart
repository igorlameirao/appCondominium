import 'package:appcondominium_mobile/app/bootstrap.dart';
import 'package:appcondominium_mobile/app/theme/theme_mode_controller.dart';
import 'package:appcondominium_mobile/core/config/app_config.dart';
import 'package:appcondominium_mobile/core/config/environment.dart';
import 'package:appcondominium_mobile/core/security/secure_key_value_store.dart';
import 'package:appcondominium_mobile/core/security/stored_session.dart';
import 'package:appcondominium_mobile/core/security/token_storage.dart';
import 'package:appcondominium_mobile/features/auth/application/auth_session_notifier.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'support/fake_jwt.dart';

const _session = StoredSession(
  idCondominio: 7,
  nome: 'Maria',
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

  test('restore com JWT válido autentica', () async {
    final storage = TokenStorage(InMemorySecureKeyValueStore());
    final token = fakeJwt(
      expUnixSeconds: unixSecondsFromNow(const Duration(hours: 4)),
      idCondominio: 7,
    );
    await storage.persistAuthenticatedSession(token: token, session: _session);

    final container = await _container(storage);
    addTearDown(container.dispose);

    await container.read(authSessionProvider.notifier).restore();
    final session = container.read(authSessionProvider);
    expect(session.isAuthenticated, isTrue);
    expect(session.token, token);
    expect(session.nome, 'Maria');
  });

  test('restore com JWT expirado limpa storage e avisa expiração', () async {
    final storage = TokenStorage(InMemorySecureKeyValueStore());
    final token = fakeJwt(
      expUnixSeconds: unixSecondsFromNow(const Duration(minutes: -5)),
      idCondominio: 7,
    );
    await storage.persistAuthenticatedSession(token: token, session: _session);

    final container = await _container(storage);
    addTearDown(container.dispose);

    await container.read(authSessionProvider.notifier).restore();
    final session = container.read(authSessionProvider);
    expect(session.isAuthenticated, isFalse);
    expect(session.sessionExpiredNotice, isTrue);
    expect(await storage.readAccessToken(), isNull);
    expect(await storage.readSession(), isNull);
  });

  test('restore com JWT malformado limpa sessão', () async {
    final storage = TokenStorage(InMemorySecureKeyValueStore());
    await storage.persistAuthenticatedSession(token: 'bad-token', session: _session);

    final container = await _container(storage);
    addTearDown(container.dispose);

    await container.read(authSessionProvider.notifier).restore();
    expect(container.read(authSessionProvider).isAuthenticated, isFalse);
    expect(await storage.readAccessToken(), isNull);
  });

  test('restore sem metadados limpa token órfão', () async {
    final storage = TokenStorage(InMemorySecureKeyValueStore());
    await storage.writeAccessToken(
      fakeJwt(expUnixSeconds: unixSecondsFromNow(const Duration(hours: 1))),
    );

    final container = await _container(storage);
    addTearDown(container.dispose);

    await container.read(authSessionProvider.notifier).restore();
    expect(container.read(authSessionProvider).isAuthenticated, isFalse);
    expect(await storage.readAccessToken(), isNull);
  });

  test('logout limpa sessão persistida', () async {
    final storage = TokenStorage(InMemorySecureKeyValueStore());
    final token = fakeJwt(expUnixSeconds: unixSecondsFromNow(const Duration(hours: 1)));
    await storage.persistAuthenticatedSession(token: token, session: _session);

    final container = await _container(storage);
    addTearDown(container.dispose);

    await container.read(authSessionProvider.notifier).restore();
    await container.read(authSessionProvider.notifier).logout();
    expect(container.read(authSessionProvider).isAuthenticated, isFalse);
    expect(await storage.readAccessToken(), isNull);
  });

  test('handleUnauthorizedFromApi desloga com aviso de expiração', () async {
    final storage = TokenStorage(InMemorySecureKeyValueStore());
    final container = await _container(storage);
    addTearDown(container.dispose);

    final token = fakeJwt(expUnixSeconds: unixSecondsFromNow(const Duration(hours: 1)));
    await storage.persistAuthenticatedSession(token: token, session: _session);
    await container.read(authSessionProvider.notifier).restore();

    await container.read(authSessionProvider.notifier).handleUnauthorizedFromApi();
    final session = container.read(authSessionProvider);
    expect(session.isAuthenticated, isFalse);
    expect(session.sessionExpiredNotice, isTrue);
  });

  test('handleForbiddenFromApi mantém sessão', () async {
    final storage = TokenStorage(InMemorySecureKeyValueStore());
    final container = await _container(storage);
    addTearDown(container.dispose);

    final token = fakeJwt(expUnixSeconds: unixSecondsFromNow(const Duration(hours: 1)));
    await storage.persistAuthenticatedSession(token: token, session: _session);
    await container.read(authSessionProvider.notifier).restore();

    await container.read(authSessionProvider.notifier).handleForbiddenFromApi();
    expect(container.read(authSessionProvider).isAuthenticated, isTrue);
  });
}