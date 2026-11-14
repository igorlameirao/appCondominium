import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../config/app_config.dart';
import '../security/token_storage.dart';
import 'interceptors/auth_interceptor.dart';
import 'interceptors/error_interceptor.dart';

/// Cliente HTTP centralizado. Instanciado para uso futuro pelos repositórios;
/// nenhuma chamada é feita na inicialização do aplicativo.
class ApiClient {
  ApiClient({
    required AppConfig config,
    required TokenStorage tokenStorage,
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
      ErrorInterceptor(),
      if (config.enableApiLogging)
        LogInterceptor(
          requestBody: true,
          responseBody: true,
          logPrint: (obj) => debugPrint('[HTTP] $obj'),
        ),
    ]);
  }

  final Dio _dio;

  Dio get dio => _dio;
}
