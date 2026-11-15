import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Tempo mínimo que a [SplashPage] permanece visível após o início.
const kSplashMinimumDisplayDuration = Duration(seconds: 2);

final splashMinimumDurationProvider = Provider<Duration>(
  (ref) => kSplashMinimumDisplayDuration,
);

/// Quanto tempo ainda falta para cumprir o mínimo de exibição (zero se já passou).
Duration splashRemainingMinimumDelay({
  required DateTime startedAt,
  required Duration minimum,
  required DateTime now,
}) {
  final remaining = minimum - now.difference(startedAt);
  if (remaining <= Duration.zero) return Duration.zero;
  return remaining;
}

/// `true` quando a inicialização terminou e o tempo mínimo já foi atingido.
bool isSplashReadyToNavigate({
  required bool initializationComplete,
  required DateTime startedAt,
  required Duration minimum,
  required DateTime now,
}) {
  if (!initializationComplete) return false;
  return splashRemainingMinimumDelay(
        startedAt: startedAt,
        minimum: minimum,
        now: now,
      ) ==
      Duration.zero;
}

Future<void> waitForSplashMinimumDisplay({
  required DateTime startedAt,
  required Duration minimum,
  DateTime Function()? now,
  void Function(Timer timer)? onTimerCreated,
}) async {
  final remaining = splashRemainingMinimumDelay(
    startedAt: startedAt,
    minimum: minimum,
    now: (now ?? DateTime.now)(),
  );
  if (remaining <= Duration.zero) return;

  final completer = Completer<void>();
  var completed = false;
  final timer = Timer(remaining, () {
    if (completed) return;
    completed = true;
    if (!completer.isCompleted) completer.complete();
  });
  onTimerCreated?.call(timer);
  try {
    await completer.future;
  } finally {
    if (!completed) {
      timer.cancel();
      if (!completer.isCompleted) completer.complete();
    }
  }
}