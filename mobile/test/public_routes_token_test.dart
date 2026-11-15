import 'package:appcondominium_mobile/app/bootstrap.dart';
import 'package:appcondominium_mobile/app/router.dart';
import 'package:appcondominium_mobile/app/theme/theme_mode_controller.dart';
import 'package:appcondominium_mobile/core/config/app_config.dart';
import 'package:appcondominium_mobile/core/config/environment.dart';
import 'package:appcondominium_mobile/core/security/secure_key_value_store.dart';
import 'package:appcondominium_mobile/core/security/token_storage.dart';
import 'package:appcondominium_mobile/features/auth/application/auth_session_notifier.dart';
import 'package:appcondominium_mobile/features/auth/presentation/forgot_password_page.dart';
import 'package:appcondominium_mobile/features/auth/presentation/login_page.dart';
import 'package:appcondominium_mobile/features/auth/presentation/reset_password_page.dart';
import 'package:appcondominium_mobile/features/convite/data/convite_repository.dart';
import 'package:appcondominium_mobile/features/convite/presentation/convite_aceite_page.dart';
import 'package:appcondominium_mobile/features/auth/data/password_recovery_repository.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'support/pump_splash.dart';

const _config = AppConfig(
  environment: AppEnvironment.development,
  apiBaseUrl: 'http://localhost:5000',
  enableApiLogging: false,
);

Future<GoRouter> _pumpRouter(
  WidgetTester tester, {
  List<Override> extraOverrides = const [],
}) async {
  SharedPreferences.setMockInitialValues({});
  final prefs = await SharedPreferences.getInstance();
  final tokenStorage = TokenStorage(InMemorySecureKeyValueStore());

  late GoRouter router;
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        appConfigProvider.overrideWithValue(_config),
        sharedPreferencesProvider.overrideWithValue(prefs),
        tokenStorageProvider.overrideWithValue(tokenStorage),
        ...extraOverrides,
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
  await pumpPastSplashMinimum(tester);
  await tester.pumpAndSettle();
  return router;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('convite e recuperação acessíveis sem sessão', (tester) async {
  late GoRouter router;
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final tokenStorage = TokenStorage(InMemorySecureKeyValueStore());

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appConfigProvider.overrideWithValue(_config),
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
    await tester.pump();
    await pumpPastSplashMinimum(tester);
    await tester.pumpAndSettle();

    router.go('${AppRoute.conviteAceitar.path}?token=x');
    await tester.pumpAndSettle();
    expect(find.byType(ConviteAceitePage), findsOneWidget);
    expect(find.byType(LoginPage), findsNothing);

    router.go(AppRoute.recuperacaoSenhaEsqueci.path);
    await tester.pumpAndSettle();
    expect(find.byType(ForgotPasswordPage), findsOneWidget);

    router.go(AppRoute.recuperacaoSenhaRedefinir.path);
    await tester.pumpAndSettle();
    expect(find.byType(ResetPasswordPage), findsOneWidget);
    expect(find.byType(LoginPage), findsNothing);
  });

  testWidgets('convite sem token exibe link inválido', (tester) async {
    final router = await _pumpRouter(tester);
    router.go(AppRoute.conviteAceitar.path);
    await tester.pumpAndSettle();

    expect(find.textContaining('Link inválido'), findsOneWidget);
  });

  testWidgets('redefinição sem token exibe link inválido ou expirado', (tester) async {
    final router = await _pumpRouter(tester);
    router.go(AppRoute.recuperacaoSenhaRedefinir.path);
    await tester.pumpAndSettle();

    expect(find.textContaining('Link inválido'), findsOneWidget);
  });

  testWidgets('convite com token rejeitado pela API exibe mensagem', (tester) async {
    final router = await _pumpRouter(
      tester,
      extraOverrides: [
        conviteRepositoryProvider.overrideWithValue(_FakeConviteRepository.invalid()),
      ],
    );
    router.go('${AppRoute.conviteAceitar.path}?token=expirado');
    await tester.pumpAndSettle();

    expect(find.textContaining('expirado'), findsOneWidget);
  });

  testWidgets('redefinição com token inválido na API exibe erro', (tester) async {
    final router = await _pumpRouter(
      tester,
      extraOverrides: [
        passwordRecoveryRepositoryProvider.overrideWithValue(
          _FakePasswordRecoveryRepository.invalid(),
        ),
      ],
    );
    router.go('${AppRoute.recuperacaoSenhaRedefinir.path}?token=usado');
    await tester.pumpAndSettle();

    expect(find.textContaining('inválido'), findsWidgets);
  });
}

class _FakeConviteRepository extends ConviteRepository {
  _FakeConviteRepository._(this._result) : super(Dio(BaseOptions(baseUrl: 'http://test')));

  final ValidarConviteResult _result;

  factory _FakeConviteRepository.invalid() => _FakeConviteRepository._(
        ValidarConviteResult(
          valido: false,
          mensagem: 'Convite expirado ou já utilizado.',
          requerAutenticacao: false,
          requerDefinirSenha: false,
        ),
      );

  @override
  Future<ValidarConviteResult> validar(String token) async => _result;
}

class _FakePasswordRecoveryRepository extends PasswordRecoveryRepository {
  _FakePasswordRecoveryRepository._(this._valid) : super(Dio(BaseOptions(baseUrl: 'http://test')));

  final bool _valid;

  factory _FakePasswordRecoveryRepository.invalid() =>
      _FakePasswordRecoveryRepository._(false);

  @override
  Future<bool> validarToken(String token) async => _valid;
}