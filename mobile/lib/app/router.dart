import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/application/auth_session.dart';
import '../features/auth/application/auth_session_notifier.dart';
import '../features/auth/presentation/login_page.dart';
import '../features/home/presentation/home_page.dart';
import '../features/home/presentation/home_pending_list_page.dart';
import '../features/splash/presentation/splash_page.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

enum AppRoute {
  splash('/'),
  login('/login'),
  home('/home'),
  homePendencias('/home/pendencias');

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
  final auth = ref.watch(authSessionProvider);
  final bootstrap = ref.watch(authBootstrapProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: AppRoute.login.path,
    refreshListenable: refresh,
    redirect: (context, state) {
      if (bootstrap.isLoading) return null;

      final location = state.matchedLocation;
      final onLogin = location == AppRoute.login.path;
      final onSplash = location == AppRoute.splash.path;

      if (auth.status == AuthStatus.unknown) return null;

      if (!auth.isAuthenticated) {
        if (onLogin || onSplash) return null;
        return AppRoute.login.path;
      }

      if (onLogin || onSplash) return AppRoute.home.path;
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
        path: AppRoute.home.path,
        name: AppRoute.home.name,
        builder: (context, state) => const HomePage(),
        routes: [
          GoRoute(
            path: 'pendencias',
            name: AppRoute.homePendencias.name,
            builder: (context, state) => const HomePendingListPage(),
          ),
        ],
      ),
    ],
  );
});