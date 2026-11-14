import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/bootstrap.dart';
import '../security/token_storage.dart';
import 'api_client.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  final config = ref.watch(appConfigProvider);
  final tokenStorage = ref.watch(tokenStorageProvider);
  return ApiClient(config: config, tokenStorage: tokenStorage);
});

final dioProvider = Provider((ref) => ref.watch(apiClientProvider).dio);
