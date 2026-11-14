import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'secure_key_value_store.dart';
import 'secure_storage_keys.dart';
import 'stored_session.dart';

final flutterSecureStorageProvider = Provider<FlutterSecureStorage>(
  (ref) => const FlutterSecureStorage(),
);

final secureKeyValueStoreProvider = Provider<SecureKeyValueStore>(
  (ref) => FlutterSecureKeyValueStore(ref.watch(flutterSecureStorageProvider)),
);

final tokenStorageProvider = Provider<TokenStorage>(
  (ref) => TokenStorage(ref.watch(secureKeyValueStoreProvider)),
);

class TokenStorage {
  TokenStorage(this._storage);

  final SecureKeyValueStore _storage;

  Future<String?> readAccessToken() =>
      _storage.read(SecureStorageKeys.accessToken);

  Future<void> writeAccessToken(String? value) async {
    if (value == null || value.isEmpty) {
      await _storage.delete(SecureStorageKeys.accessToken);
      return;
    }
    await _storage.write(SecureStorageKeys.accessToken, value);
  }

  Future<StoredSession?> readSession() async {
    final raw = await _storage.read(SecureStorageKeys.sessionMetadata);
    return StoredSession.decode(raw);
  }

  Future<void> writeSession(StoredSession? session) async {
    if (session == null) {
      await _storage.delete(SecureStorageKeys.sessionMetadata);
      return;
    }
    await _storage.write(
      SecureStorageKeys.sessionMetadata,
      session.encode(),
    );
  }

  Future<void> persistAuthenticatedSession({
    required String token,
    required StoredSession session,
  }) async {
    await writeAccessToken(token);
    await writeSession(session);
  }

  Future<void> clearSession() async {
    await _storage.delete(SecureStorageKeys.accessToken);
    await _storage.delete(SecureStorageKeys.sessionMetadata);
  }
}
