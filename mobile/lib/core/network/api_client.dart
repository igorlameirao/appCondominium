import 'package:dio/dio.dart';

import '../config/app_config.dart';
import '../security/token_storage.dart';
import '../../features/auth/application/auth_session_notifier.dart';
import 'interceptors/auth_interceptor.dart';
import 'interceptors/error_interceptor.dart';
import 'interceptors/sensitive_log_interceptor.dart';
import 'interceptors/session_error_interceptor.dart';

/// Cliente HTTP centralizado para os repositórios das features.
class ApiClient {
  ApiClient({
    required AppConfig config,
    required TokenStorage tokenStorage,
    AuthSessionNotifier? sessionNotifier,
  }) : _dio = Dio(
          BaseOptions(
            baseUrl: config.apiBaseUrl,
            connectTimeout: const Duration(seconds: 30),
            receiveTimeout: const Duration(seconds: 30),
            headers: const {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          ),
        ) {
    _dio.interceptors.addAll([
      AuthInterceptor(tokenStorage),
      if (sessionNotifier != null)
        SessionErrorInterceptor(sessionNotifier),
      ErrorInterceptor(),
      if (config.enableApiLogging) SensitiveLogInterceptor(),
    ]);
  }

  final Dio _dio;

  Dio get dio => _dio;
}
