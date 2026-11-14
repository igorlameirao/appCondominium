import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'secure_storage_keys.dart';

final secureStorageProvider = Provider<FlutterSecureStorage>(
  (ref) => const FlutterSecureStorage(),
);

final tokenStorageProvider = Provider<TokenStorage>(
  (ref) => TokenStorage(ref.watch(secureStorageProvider)),
);

class TokenStorage {
  TokenStorage(this._storage);

  final FlutterSecureStorage _storage;

  Future<String?> readAccessToken() =>
      _storage.read(key: SecureStorageKeys.accessToken);

  Future<void> writeAccessToken(String? value) async {
    if (value == null || value.isEmpty) {
      await _storage.delete(key: SecureStorageKeys.accessToken);
      return;
    }
    await _storage.write(key: SecureStorageKeys.accessToken, value: value);
  }

  Future<void> clearSession() async {
    await _storage.delete(key: SecureStorageKeys.accessToken);
    await _storage.delete(key: SecureStorageKeys.refreshPlaceholder);
  }
}
