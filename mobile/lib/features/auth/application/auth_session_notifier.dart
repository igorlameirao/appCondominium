import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/security/jwt_payload.dart';
import '../../../core/security/token_storage.dart';
import '../../units/application/selected_unit_notifier.dart';
import '../data/models/auth_dtos.dart';
import 'auth_session.dart';

final authSessionProvider =
    NotifierProvider<AuthSessionNotifier, AuthSession>(
  AuthSessionNotifier.new,
);

/// Restauração assíncrona da sessão persistida.
final authBootstrapProvider = FutureProvider<void>((ref) async {
  await ref.read(authSessionProvider.notifier).restore();
});

class AuthSessionNotifier extends Notifier<AuthSession> {
  @override
  AuthSession build() => const AuthSession.unknown();

  TokenStorage get _storage => ref.read(tokenStorageProvider);

  Future<void> restore() async {
    final token = await _storage.readAccessToken();
    final stored = await _storage.readSession();

    if (token == null || token.isEmpty || stored == null) {
      if (token != null && token.isNotEmpty) {
        await _storage.clearSession();
      }
      state = const AuthSession.unauthenticated();
      return;
    }

    final analysis = JwtPayload.analyzeAccessToken(token);
    switch (analysis.status) {
      case JwtAccessTokenLocalStatus.valid:
        final claims = analysis.payload;
        if (claims?.idCondominio != null &&
            claims!.idCondominio != stored.idCondominio) {
          await _storage.clearSession();
          state = const AuthSession.unauthenticated();
          return;
        }
        state = AuthSession.authenticated(
          token: token,
          idCondominio: stored.idCondominio,
          condominioNome: stored.condominioNome,
          nome: stored.nome,
          perfil: stored.perfil,
          acessoTotal: stored.acessoTotal,
          permissoes: stored.permissoes,
        );
        await ref.read(selectedUnitProvider.notifier).refreshAfterLogin();
        return;
      case JwtAccessTokenLocalStatus.expired:
        await _storage.clearSession();
        state = const AuthSession.unauthenticated(sessionExpiredNotice: true);
        return;
      case JwtAccessTokenLocalStatus.malformed:
        await _storage.clearSession();
        state = const AuthSession.unauthenticated();
        return;
    }
  }

  Future<void> applyLoginResponse(
    LoginResponseDto response, {
    String? condominioNome,
  }) async {
    final session = AuthSession.authenticated(
      token: response.token,
      idCondominio: response.idCondominio,
      condominioNome: condominioNome,
      nome: response.nome,
      perfil: response.perfil,
      acessoTotal: response.acessoTotal,
      permissoes: response.permissoes,
    );
    await _storage.persistAuthenticatedSession(
      token: response.token,
      session: session.toStoredSession(),
    );
    state = session;
  }

  Future<void> logout({bool sessionExpired = false}) async {
    await _storage.clearSession();
    state = AuthSession.unauthenticated(sessionExpiredNotice: sessionExpired);
  }

  void clearSessionExpiredNotice() {
    if (!state.sessionExpiredNotice) return;
    state = state.copyWith(sessionExpiredNotice: false);
  }

  Future<void> handleUnauthorizedFromApi() async {
    await logout(sessionExpired: true);
  }

  Future<void> handleForbiddenFromApi() async {
    // Mantém sessão; apenas sinaliza na camada de apresentação quando necessário.
  }
}