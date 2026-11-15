import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../app/theme/app_colors.dart';
import '../../../features/auth/application/auth_session.dart';
import '../../../features/auth/application/auth_session_notifier.dart';
import '../../../shared/widgets/app_brand_mark.dart';
import '../splash_coordinator.dart';
import '../splash_timing.dart';

class SplashPage extends ConsumerStatefulWidget {
  const SplashPage({super.key});

  @override
  ConsumerState<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends ConsumerState<SplashPage> {
  var _navigationScheduled = false;
  Timer? _minimumDisplayTimer;

  @override
  void dispose() {
    _minimumDisplayTimer?.cancel();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _scheduleNavigation());
  }

  bool get _initializationComplete {
    final bootstrap = ref.read(authBootstrapProvider);
    if (!bootstrap.hasValue) return false;
    final auth = ref.read(authSessionProvider);
    return auth.status != AuthStatus.unknown;
  }

  Future<void> _scheduleNavigation() async {
    if (_navigationScheduled || !mounted) return;
    if (ref.read(splashNavigationCompletedProvider)) return;
    if (!_initializationComplete) return;

    _navigationScheduled = true;
    final minimum = ref.read(splashMinimumDurationProvider);
    final anchor = ref.read(splashDisplayAnchorProvider);
    await waitForSplashMinimumDisplay(
      startedAt: anchor,
      minimum: minimum,
      onTimerCreated: (timer) => _minimumDisplayTimer = timer,
    );

    if (!mounted || ref.read(splashNavigationCompletedProvider)) {
      _navigationScheduled = false;
      return;
    }

    final auth = ref.read(authSessionProvider);
    if (auth.status == AuthStatus.unknown) {
      _navigationScheduled = false;
      return;
    }

    final destination = auth.isAuthenticated
        ? AppRoute.home.path
        : AppRoute.login.path;
    context.go(destination);
    if (!mounted) return;
    ref.read(splashNavigationCompletedProvider.notifier).state = true;
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(authBootstrapProvider);

    final auth = ref.watch(authSessionProvider);

    ref.listen<AsyncValue<void>>(authBootstrapProvider, (previous, next) {
      if (next.hasValue) {
        WidgetsBinding.instance
            .addPostFrameCallback((_) => _scheduleNavigation());
      }
    });

    if (auth.status != AuthStatus.unknown &&
        ref.read(authBootstrapProvider).hasValue) {
      WidgetsBinding.instance
          .addPostFrameCallback((_) => _scheduleNavigation());
    }

    final horizontalPadding =
        (MediaQuery.sizeOf(context).width * 0.06 + 8).clamp(24.0, 48.0);

    return Scaffold(
      backgroundColor: AppColors.homeScaffoldLight,
      body: Center(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: horizontalPadding),
          child: const AppBrandMark(lightBackground: true),
        ),
      ),
    );
  }
}