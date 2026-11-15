import 'package:appcondominium_mobile/app/bootstrap.dart';
import 'package:appcondominium_mobile/app/router.dart';
import 'package:appcondominium_mobile/app/theme/theme_mode_controller.dart';
import 'package:appcondominium_mobile/core/config/app_config.dart';
import 'package:appcondominium_mobile/core/config/environment.dart';
import 'package:appcondominium_mobile/core/security/secure_key_value_store.dart';
import 'package:appcondominium_mobile/core/security/token_storage.dart';
import 'package:appcondominium_mobile/features/auth/application/auth_session_notifier.dart';
import 'package:appcondominium_mobile/core/security/stored_session.dart';
import 'package:appcondominium_mobile/features/auth/presentation/login_page.dart';
import 'package:appcondominium_mobile/features/splash/presentation/splash_page.dart';
import 'package:appcondominium_mobile/features/splash/splash_timing.dart';
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

  Future<GoRouter> pumpSplashApp(WidgetTester tester) async {
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
          splashMinimumDurationProvider.overrideWithValue(
            kSplashMinimumDisplayDuration,
          ),
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
    await tester.pump();
    return router;
  }

  testWidgets(
    'mantém a splash visível pelo menos 2s antes de ir ao login',
    (tester) async {
      await pumpSplashApp(tester);

      expect(find.byType(SplashPage), findsOneWidget);
      expect(find.byType(LoginPage), findsNothing);

      await tester.pump(const Duration(milliseconds: 100));
      await tester.pump(const Duration(milliseconds: 900));

      expect(find.byType(SplashPage), findsOneWidget);
      expect(find.byType(LoginPage), findsNothing);

      await tester.pump(const Duration(seconds: 1));
      await tester.pumpAndSettle();

      expect(find.byType(LoginPage), findsOneWidget);
      expect(find.byType(SplashPage), findsNothing);
    },
  );

  testWidgets('com JWT expirado vai ao login após o mínimo', (tester) async {
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
    await tester.pump();
    await pumpPastSplashMinimum(tester);
    await tester.pumpAndSettle();

    expect(find.byType(LoginPage), findsOneWidget);
    expect(find.byType(SplashPage), findsNothing);
  });
}