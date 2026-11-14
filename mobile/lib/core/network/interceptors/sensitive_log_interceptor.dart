import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

/// Log HTTP sem expor `senha` nem corpo completo de autenticação.
class SensitiveLogInterceptor extends Interceptor {
  void logPrint(Object object) => debugPrint('[HTTP] $object');

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final method = options.method;
    final uri = options.uri;
    final redactedBody = _redactBody(options.data);
    logPrint('--> $method $uri');
    if (redactedBody != null) {
      logPrint('Body: $redactedBody');
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    logPrint('<-- ${response.statusCode} ${response.requestOptions.uri}');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    logPrint(
      '*** DioException ${err.response?.statusCode} ${err.requestOptions.uri}',
    );
    handler.next(err);
  }

  String? _redactBody(Object? data) {
    if (data is Map) {
      final copy = Map<String, dynamic>.from(data);
      if (copy.containsKey('senha')) {
        copy['senha'] = '***';
      }
      return copy.toString();
    }
    return data?.toString();
  }
}