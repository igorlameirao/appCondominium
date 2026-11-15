import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

/// Log HTTP sem expor credenciais, tokens ou dados sensíveis.
class SensitiveLogInterceptor extends Interceptor {
  static final RegExp _jwtPattern = RegExp(
    r'eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+',
  );

  void logPrint(Object object) => debugPrint('[HTTP] $object');

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final method = options.method;
    final uri = _redactUri(options.uri);
    final redactedBody = _formatRedactedBody(options.data);
    logPrint('--> $method $uri');
    if (redactedBody != null) {
      logPrint('Body: $redactedBody');
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    logPrint(
      '<-- ${response.statusCode} ${_redactUri(response.requestOptions.uri)}',
    );
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    logPrint(
      '*** DioException ${err.response?.statusCode} ${_redactUri(err.requestOptions.uri)}',
    );
    handler.next(err);
  }

  String _redactUri(Uri uri) {
    if (uri.queryParameters.isEmpty) {
      return _redactSensitiveScalars(uri.toString());
    }

    final params = Map<String, String>.from(uri.queryParameters);
    for (final key in params.keys.toList()) {
      final value = params[key];
      if (value == null) {
        continue;
      }
      if (_isSensitiveKey(key) || _looksLikeJwt(value)) {
        params[key] = '***';
      }
    }

    return uri.replace(queryParameters: params).toString();
  }

  String? _formatRedactedBody(Object? data) {
    if (data == null) {
      return null;
    }
    final redacted = _redactData(data);
    return redacted.toString();
  }

  Object? _redactData(Object? value) {
    if (value is Map) {
      final redacted = <String, dynamic>{};
      for (final entry in value.entries) {
        final key = entry.key.toString();
        final child = entry.value;
        if (_isSensitiveKey(key)) {
          redacted[key] = '***';
        } else {
          redacted[key] = _redactData(child);
        }
      }
      return redacted;
    }
    if (value is List) {
      return value.map(_redactData).toList();
    }
    if (value is String) {
      return _redactSensitiveScalars(value);
    }
    return value;
  }

  String _redactSensitiveScalars(String text) {
    if (_looksLikeJwt(text)) {
      return '***';
    }
    if (text.startsWith('Bearer ')) {
      return 'Bearer ***';
    }
    return text;
  }

  static bool _isSensitiveKey(String key) {
    final normalized = key.toLowerCase().replaceAll(RegExp(r'[_\-\s]'), '');
    const exact = {
      'token',
      'accesstoken',
      'refreshtoken',
      'password',
      'senha',
      'authorization',
      'secret',
      'apikey',
    };
    if (exact.contains(normalized)) {
      return true;
    }
    if (normalized.endsWith('token')) {
      return true;
    }
    if (normalized.contains('password') || normalized.contains('senha')) {
      return true;
    }
    return false;
  }

  static bool _looksLikeJwt(String value) => _jwtPattern.hasMatch(value);
}