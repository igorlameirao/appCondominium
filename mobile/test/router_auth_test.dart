import 'package:appcondominium_mobile/app/bootstrap.dart';
import 'package:appcondominium_mobile/app/router.dart';
import 'package:appcondominium_mobile/app/theme/theme_mode_controller.dart';
import 'package:appcondominium_mobile/core/config/app_config.dart';
import 'package:appcondominium_mobile/core/config/environment.dart';
import 'package:appcondominium_mobile/core/security/secure_key_value_store.dart';
import 'package:appcondominium_mobile/core/security/stored_session.dart';
import 'package:appcondominium_mobile/core/security/token_storage.dart';
import 'package:appcondominium_mobile/features/auth/application/auth_session_notifier.dart';
import 'package:appcondominium_mobile/features/auth/presentation/login_page.dart';
import 'package:appcondominium_mobile/features/home/presentation/home_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'support/fake_jwt.dart';
import 'support/pump_splash.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const config = AppConfig(
    environment: AppEnvironment.development,
    apiBaseUrl: 'http://localhost:5000',
    enableApiLogging: false,
  );

  testWidgets('rota /home redireciona para login sem sessão', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final tokenStorage = TokenStorage(InMemorySecureKeyValueStore());

    late GoRouter router;
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appConfigProvider.overrideWithValue(config),
          sharedPreferencesProvider.overrideWithValue(prefs),
          tokenStorageProvider.overrideWithValue(tokenStorage),
        ],
        child: Consumer(
          builder: (context, ref, _) {
            router = ref.watch(appRouterProvider);
            ref.watch(authBootstrapProvider);
            return MaterialApp.router(routerConfig: router);
          },
        ),
      ),
    );
    await tester.pumpAndSettle();

    router.go(AppRoute.home.path);
    await tester.pumpAndSettle();

    expect(find.byType(LoginPage), findsOneWidget);
    expect(find.byType(HomePage), findsNothing);
  });

  testWidgets('reabertura com JWT válido permite Home', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final tokenStorage = TokenStorage(InMemorySecureKeyValueStore());
    final token = fakeJwt(
      expUnixSeconds: unixSecondsFromNow(const Duration(hours: 3)),
      idCondominio: 1,
    );
    await tokenStorage.persistAuthenticatedSession(
      token: token,
      session: const StoredSession(
        idCondominio: 1,
        nome: 'Maria',
        perfil: 'Morador',
        acessoTotal: false,
        permissoes: [],
      ),
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appConfigProvider.overrideWithValue(config),
          sharedPreferencesProvider.overrideWithValue(prefs),
          tokenStorageProvider.overrideWithValue(tokenStorage),
        ],
        child: Consumer(
          builder: (context, ref, _) {
            ref.watch(authBootstrapProvider);
            return MaterialApp.router(
              routerConfig: ref.watch(appRouterProvider),
            );
          },
        ),
      ),
    );
    await pumpPastSplashMinimum(tester);
    await tester.pumpAndSettle();

    expect(find.byType(HomePage), findsOneWidget);
    expect(find.byType(LoginPage), findsNothing);
  });

  testWidgets('reabertura com JWT expirado redireciona ao login', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final tokenStorage = TokenStorage(InMemorySecureKeyValueStore());
    final token = fakeJwt(
      expUnixSeconds: unixSecondsFromNow(const Duration(minutes: -1)),
      idCondominio: 1,
    );
    await tokenStorage.persistAuthenticatedSession(
      token: token,
      session: const StoredSession(
        idCondominio: 1,
        nome: 'Maria',
        perfil: 'Morador',
        acessoTotal: false,
        permissoes: [],
      ),
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appConfigProvider.overrideWithValue(config),
          sharedPreferencesProvider.overrideWithValue(prefs),
          tokenStorageProvider.overrideWithValue(tokenStorage),
        ],
        child: Consumer(
          builder: (context, ref, _) {
            ref.watch(authBootstrapProvider);
            return MaterialApp.router(
              routerConfig: ref.watch(appRouterProvider),
            );
          },
        ),
      ),
    );
    await pumpPastSplashMinimum(tester);
    await tester.pumpAndSettle();

    expect(find.byType(LoginPage), findsOneWidget);
    expect(find.byType(HomePage), findsNothing);
  });
}