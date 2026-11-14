import 'package:dio/dio.dart';

import '../api_exception.dart';

class ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final response = err.response;
    final message = _messageFromResponse(response) ?? err.message ?? 'Erro de rede';
    handler.reject(
      DioException(
        requestOptions: err.requestOptions,
        response: err.response,
        type: err.type,
        error: ApiException(
          message: message,
          statusCode: response?.statusCode,
          cause: err,
        ),
      ),
    );
  }

  String? _messageFromResponse(Response<dynamic>? response) {
    final data = response?.data;
    if (data is String && data.isNotEmpty) return data;
    if (data is Map && data['message'] is String) {
      return data['message'] as String;
    }
    return null;
  }
}
