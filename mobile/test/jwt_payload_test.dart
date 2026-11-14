import 'dart:convert';

import 'package:appcondominium_mobile/core/security/jwt_payload.dart';
import 'package:flutter_test/flutter_test.dart';

import 'support/fake_jwt.dart';

void main() {
  test('extrai idPessoa, idCondominio e exp do payload', () {
    final exp = unixSecondsFromNow(const Duration(hours: 1));
    final token = fakeJwt(expUnixSeconds: exp, sub: '42', idCondominio: 7);
    final claims = JwtPayload.fromToken(token);
    expect(claims?.idPessoa, 42);
    expect(claims?.idCondominio, 7);
    expect(claims?.expiresAtUtc?.millisecondsSinceEpoch, exp * 1000);
  });

  test('analyzeAccessToken — válido', () {
    final token = fakeJwt(expUnixSeconds: unixSecondsFromNow(const Duration(hours: 2)));
    final result = JwtPayload.analyzeAccessToken(token);
    expect(result.status, JwtAccessTokenLocalStatus.valid);
    expect(result.payload, isNotNull);
  });

  test('analyzeAccessToken — expirado', () {
    final token = fakeJwt(expUnixSeconds: unixSecondsFromNow(const Duration(hours: -1)));
    final result = JwtPayload.analyzeAccessToken(token);
    expect(result.status, JwtAccessTokenLocalStatus.expired);
  });

  test('analyzeAccessToken — ausente', () {
    expect(
      JwtPayload.analyzeAccessToken(null).status,
      JwtAccessTokenLocalStatus.malformed,
    );
    expect(
      JwtPayload.analyzeAccessToken('').status,
      JwtAccessTokenLocalStatus.malformed,
    );
  });

  test('analyzeAccessToken — malformado', () {
    expect(
      JwtPayload.analyzeAccessToken('not-a-jwt').status,
      JwtAccessTokenLocalStatus.malformed,
    );
    final noExp = base64Url.encode(utf8.encode('{"sub":"1"}'));
    final token = 'h.$noExp.s';
    expect(
      JwtPayload.analyzeAccessToken(token).status,
      JwtAccessTokenLocalStatus.malformed,
    );
  });
}