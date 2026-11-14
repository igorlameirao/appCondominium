import 'package:appcondominium_mobile/core/security/secure_key_value_store.dart';
import 'package:appcondominium_mobile/core/security/stored_session.dart';
import 'package:appcondominium_mobile/core/security/token_storage.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('persistência segura de JWT e metadados de sessão', () async {
    final storage = TokenStorage(InMemorySecureKeyValueStore());
    const session = StoredSession(
      idCondominio: 4,
      condominioNome: 'Alpha',
      nome: 'João',
      perfil: 'Morador',
      acessoTotal: false,
      permissoes: ['x'],
    );

    await storage.persistAuthenticatedSession(token: 'jwt-abc', session: session);

    expect(await storage.readAccessToken(), 'jwt-abc');
    final restored = await storage.readSession();
    expect(restored?.idCondominio, 4);
    expect(restored?.nome, 'João');

    await storage.clearSession();
    expect(await storage.readAccessToken(), isNull);
    expect(await storage.readSession(), isNull);
  });
}