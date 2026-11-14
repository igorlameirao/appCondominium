import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

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

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: AppRoute.login.path,
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
