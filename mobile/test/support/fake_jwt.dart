import 'dart:convert';

/// JWT mínimo para testes (assinatura não verificada pelo app).
String fakeJwt({
  required int expUnixSeconds,
  String sub = '42',
  int idCondominio = 7,
}) {
  final header = base64Url.encode(utf8.encode('{"alg":"HS256","typ":"JWT"}'));
  final payload = base64Url.encode(
    utf8.encode(
      jsonEncode({
        'sub': sub,
        'idCondominio': idCondominio,
        'exp': expUnixSeconds,
      }),
    ),
  );
  return '$header.$payload.fake-signature';
}

int unixSecondsFromNow(Duration offset) =>
    DateTime.now().toUtc().add(offset).millisecondsSinceEpoch ~/ 1000;