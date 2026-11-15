import 'dart:convert';

/// Resultado da checagem local do access token (sem validar assinatura).
enum JwtAccessTokenLocalStatus {
  valid,
  expired,
  malformed,
}

/// Lê claims essenciais do JWT (payload) sem validar assinatura — apenas cache local.
class JwtPayload {
  const JwtPayload({
    this.idPessoa,
    this.idCondominio,
    this.expiresAtUtc,
  });

  final int? idPessoa;
  final int? idCondominio;
  final DateTime? expiresAtUtc;

  /// Analisa estrutura e `exp` do token; não substitui validação na API.
  static ({JwtAccessTokenLocalStatus status, JwtPayload? payload}) analyzeAccessToken(
    String? token,
  ) {
    if (token == null || token.isEmpty) {
      return (status: JwtAccessTokenLocalStatus.malformed, payload: null);
    }
    final payload = fromToken(token);
    if (payload == null || payload.expiresAtUtc == null) {
      return (status: JwtAccessTokenLocalStatus.malformed, payload: payload);
    }
    final now = DateTime.now().toUtc();
    if (!now.isBefore(payload.expiresAtUtc!)) {
      return (status: JwtAccessTokenLocalStatus.expired, payload: payload);
    }
    return (status: JwtAccessTokenLocalStatus.valid, payload: payload);
  }

  bool get isExpiredLocally {
    final exp = expiresAtUtc;
    if (exp == null) return true;
    return !DateTime.now().toUtc().isBefore(exp);
  }

  static JwtPayload? fromToken(String token) {
    final parts = token.split('.');
    if (parts.length < 2) return null;
    try {
      final normalized = base64Url.normalize(parts[1]);
      final json = utf8.decode(base64Url.decode(normalized));
      final map = jsonDecode(json) as Map<String, dynamic>;
      final sub = map['sub'] ??
          map['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
      final idPessoa = sub is num
          ? sub.toInt()
          : int.tryParse(sub?.toString() ?? '');
      final condoRaw = map['idCondominio'];
      final idCondominio = condoRaw is num
          ? condoRaw.toInt()
          : int.tryParse(condoRaw?.toString() ?? '');
      final expRaw = map['exp'];
      DateTime? expiresAtUtc;
      if (expRaw is num) {
        expiresAtUtc =
            DateTime.fromMillisecondsSinceEpoch(expRaw.toInt() * 1000, isUtc: true);
      } else if (expRaw != null) {
        final parsed = int.tryParse(expRaw.toString());
        if (parsed != null) {
          expiresAtUtc =
              DateTime.fromMillisecondsSinceEpoch(parsed * 1000, isUtc: true);
        }
      }
      return JwtPayload(
        idPessoa: idPessoa,
        idCondominio: idCondominio,
        expiresAtUtc: expiresAtUtc,
      );
    } catch (_) {
      return null;
    }
  }
}