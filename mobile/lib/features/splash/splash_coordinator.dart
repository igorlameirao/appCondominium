import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Momento em que a splash da sessão atual começou (sobrevive a rebuild do router).
final splashDisplayAnchorProvider = Provider<DateTime>((ref) {
  ref.keepAlive();
  return DateTime.now();
});

/// Evita redirecionamento duplicado após recriação da [SplashPage].
final splashNavigationCompletedProvider = StateProvider<bool>((ref) => false);