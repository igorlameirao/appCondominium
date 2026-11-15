import 'package:appcondominium_mobile/core/network/interceptors/sensitive_log_interceptor.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('SensitiveLogInterceptor mascara senha e não loga Authorization', () {
    final logs = <String>[];
    debugPrint = (message, {wrapWidth}) => logs.add(message.toString());

    final interceptor = SensitiveLogInterceptor();
    interceptor.onRequest(
      RequestOptions(
        path: '/api/auth/login',
        method: 'POST',
        data: {'usuario': 'a@a.com', 'senha': 'segredo123'},
        headers: {'Authorization': 'Bearer jwt-secreto'},
      ),
      _NoOpRequestHandler(),
    );

    final joined = logs.join('\n');
    expect(joined, isNot(contains('segredo123')));
    expect(joined, contains('***'));
    expect(joined, isNot(contains('jwt-secreto')));
    expect(joined, isNot(contains('Bearer jwt-secreto')));

    debugPrint = debugPrintThrottled;
  });

  test('mascara tokens aninhados e parâmetros de URL', () {
    final logs = <String>[];
    debugPrint = (message, {wrapWidth}) => logs.add(message.toString());

    const jwt =
        'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
    const inviteToken = 'convite-recuperacao-secreto-xyz';

    final interceptor = SensitiveLogInterceptor();
    interceptor.onRequest(
      RequestOptions(
        path: '/api/convite/aceitar',
        method: 'POST',
        queryParameters: {'token': inviteToken},
        data: {
          'usuario': 'a@a.com',
          'credenciais': {
            'accessToken': jwt,
            'refreshToken': 'refresh-valor-secreto',
          },
          'password': 'outra-senha',
        },
      ),
      _NoOpRequestHandler(),
    );

    final joined = logs.join('\n');
    expect(joined, contains('a@a.com'));
    expect(joined, isNot(contains(inviteToken)));
    expect(joined, isNot(contains(jwt)));
    expect(joined, isNot(contains('refresh-valor-secreto')));
    expect(joined, isNot(contains('outra-senha')));
    expect(joined, contains('***'));

    debugPrint = debugPrintThrottled;
  });
}

class _NoOpRequestHandler extends RequestInterceptorHandler {}