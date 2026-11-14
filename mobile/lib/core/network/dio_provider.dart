import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/bootstrap.dart';
import '../../features/auth/application/auth_session_notifier.dart';
import '../security/token_storage.dart';
import 'api_client.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  final config = ref.watch(appConfigProvider);
  final tokenStorage = ref.watch(tokenStorageProvider);
  final sessionNotifier = ref.watch(authSessionProvider.notifier);
  return ApiClient(
    config: config,
    tokenStorage: tokenStorage,
    sessionNotifier: sessionNotifier,
  );
});

final dioProvider = Provider((ref) => ref.watch(apiClientProvider).dio);
