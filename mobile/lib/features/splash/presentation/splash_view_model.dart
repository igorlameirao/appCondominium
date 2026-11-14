import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/bootstrap.dart';

enum SplashStatus { idle, ready }

class SplashState {
  const SplashState({
    required this.status,
    required this.environmentLabel,
  });

  final SplashStatus status;
  final String environmentLabel;
}

final splashViewModelProvider =
    NotifierProvider<SplashViewModel, SplashState>(SplashViewModel.new);

class SplashViewModel extends Notifier<SplashState> {
  @override
  SplashState build() {
    final config = ref.read(appConfigProvider);
    return SplashState(
      status: SplashStatus.ready,
      environmentLabel: config.environment.label,
    );
  }
}
