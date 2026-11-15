import 'package:appcondominium_mobile/core/errors/app_failure.dart';
import 'package:appcondominium_mobile/core/network/api_exception.dart';
import 'package:appcondominium_mobile/features/auth/data/auth_exception_mapper.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

DioException _dioException({int? status, String message = 'msg'}) {
  return DioException(
    requestOptions: RequestOptions(path: '/api/auth/login'),
    response: status == null
        ? null
        : Response(
            requestOptions: RequestOptions(path: '/api/auth/login'),
            statusCode: status,
            data: message,
          ),
    error: ApiException(message: message, statusCode: status),
    type: DioExceptionType.badResponse,
  );
}

void main() {
  test('401 durante login vira InvalidCredentialsFailure', () {
    final failure = mapAuthApiError(_dioException(status: 401), duringLogin: true);
    expect(failure, isA<InvalidCredentialsFailure>());
  });

  test('401 fora do login vira UnauthorizedFailure', () {
    final failure =
        mapAuthApiError(_dioException(status: 401), duringLogin: false);
    expect(failure, isA<UnauthorizedFailure>());
  });

  test('403 vira ForbiddenFailure', () {
    final failure = mapAuthApiError(_dioException(status: 403), duringLogin: true);
    expect(failure, isA<ForbiddenFailure>());
  });

  test('timeout vira NetworkFailure', () {
    final failure = mapAuthApiError(
      DioException(
        requestOptions: RequestOptions(path: '/x'),
        type: DioExceptionType.connectionTimeout,
      ),
      duringLogin: true,
    );
    expect(failure, isA<NetworkFailure>());
  });
}