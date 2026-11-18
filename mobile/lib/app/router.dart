import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/application/auth_session.dart';
import '../features/auth/application/auth_session_notifier.dart';
import '../features/auth/presentation/login_page.dart';
import '../features/home/presentation/home_page.dart';
import '../features/home/presentation/home_pending_list_page.dart';
import '../features/splash/presentation/splash_page.dart';
import '../features/convite/presentation/convite_aceite_page.dart';
import '../features/auth/presentation/forgot_password_page.dart';
import '../features/auth/presentation/reset_password_page.dart';
import '../features/conta/presentation/account_settings_page.dart';
import '../features/conta/presentation/change_password_page.dart';
import '../features/conta/presentation/notification_preferences_page.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

enum AppRoute {
  splash('/'),
  login('/login'),
  home('/home'),
  homePendencias('/home/pendencias'),
  conviteAceitar('/convite/aceitar'),
  recuperacaoSenhaEsqueci('/recuperacao-senha/esqueci'),
  recuperacaoSenhaRedefinir('/recuperacao-senha/redefinir'),
  contaConfiguracoes('/home/configuracoes-conta'),
  contaAlterarSenha('/home/alterar-senha'),
  contaNotificacoes('/home/notificacoes');

  const AppRoute(this.path);
  final String path;
}

final _routerRefreshListenableProvider = Provider<ValueNotifier<int>>((ref) {
  final listenable = ValueNotifier(0);
  ref.onDispose(listenable.dispose);
  ref.listen<AuthSession>(authSessionProvider, (_, _) {
    listenable.value++;
  });
  ref.listen(authBootstrapProvider, (_, next) {
    if (next.hasValue) listenable.value++;
  });
  return listenable;
});

final appRouterProvider = Provider<GoRouter>((ref) {
  final refresh = ref.watch(_routerRefreshListenableProvider);

  final router = GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: AppRoute.splash.path,
    refreshListenable: refresh,
    redirect: (context, state) {
      final bootstrap = ref.read(authBootstrapProvider);
      if (bootstrap.isLoading) return null;

      final auth = ref.read(authSessionProvider);
      final location = state.matchedLocation;
      final onLogin = location == AppRoute.login.path;
      final onSplash = location == AppRoute.splash.path;

      // A SplashPage controla saída (tempo mínimo + restauração de sessão).
      if (onSplash) return null;
      final onConvite = location.startsWith(AppRoute.conviteAceitar.path);
      final onRecuperacaoSenha =
          location.startsWith('/recuperacao-senha/');

      if (auth.status == AuthStatus.unknown) return null;

      if (!auth.isAuthenticated) {
        if (onLogin || onSplash || onConvite || onRecuperacaoSenha) return null;
        return AppRoute.login.path;
      }

      if (onLogin) return AppRoute.home.path;
      return null;
    },
    routes: [
      GoRoute(
        path: AppRoute.splash.path,
        name: AppRoute.splash.name,
        builder: (context, state) => const SplashPage(),
      ),
      GoRoute(
        path: AppRoute.login.path,
        name: AppRoute.login.name,
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: AppRoute.conviteAceitar.path,
        name: AppRoute.conviteAceitar.name,
        builder: (context, state) => ConviteAceitePage(
          token: state.uri.queryParameters['token'] ?? '',
        ),
      ),
      GoRoute(
        path: AppRoute.recuperacaoSenhaEsqueci.path,
        name: AppRoute.recuperacaoSenhaEsqueci.name,
        builder: (context, state) => const ForgotPasswordPage(),
      ),
      GoRoute(
        path: AppRoute.recuperacaoSenhaRedefinir.path,
        name: AppRoute.recuperacaoSenhaRedefinir.name,
        builder: (context, state) => ResetPasswordPage(
          token: state.uri.queryParameters['token'] ?? '',
        ),
      ),
      GoRoute(
        path: AppRoute.home.path,
        name: AppRoute.home.name,
        builder: (context, state) => const HomePage(),
        routes: [
          GoRoute(
            path: 'pendencias',
            name: AppRoute.homePendencias.name,
            builder: (context, state) => const HomePendingListPage(),
          ),
          GoRoute(
            path: 'configuracoes-conta',
            name: AppRoute.contaConfiguracoes.name,
            builder: (context, state) => const AccountSettingsPage(),
          ),
          GoRoute(
            path: 'alterar-senha',
            name: AppRoute.contaAlterarSenha.name,
            builder: (context, state) => const ChangePasswordPage(),
          ),
          GoRoute(
            path: 'notificacoes',
            name: AppRoute.contaNotificacoes.name,
            builder: (context, state) => const NotificationPreferencesPage(),
          ),
        ],
      ),
    ],
  );
  ref.onDispose(router.dispose);
  return router;
});