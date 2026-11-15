import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_paths.dart';
import '../../../core/network/dio_provider.dart';
import 'auth_exception_mapper.dart';
import 'models/auth_dtos.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(dioProvider));
});

class AuthRepository {
  AuthRepository(this._dio);

  final Dio _dio;

  Future<List<CondominioVinculoDto>> listarVinculos({
    required String usuario,
    required String senha,
  }) async {
    try {
      final response = await _dio.post<dynamic>(
        ApiPaths.authVinculos,
        data: credenciaisRequestToJson(usuario: usuario, senha: senha),
      );
      final data = response.data;
      if (data is! List) return const [];
      return data
          .map(
            (e) => CondominioVinculoDto.fromJson(e as Map<String, dynamic>),
          )
          .toList();
    } on DioException catch (e) {
      throw mapAuthApiError(e, duringLogin: true);
    }
  }

  Future<LoginResponseDto> login({
    required String usuario,
    required String senha,
    required int idCondominio,
    int? idPerfil,
  }) async {
    try {
      final response = await _dio.post<dynamic>(
        ApiPaths.authLogin,
        data: loginRequestToJson(
          usuario: usuario,
          senha: senha,
          idCondominio: idCondominio,
          idPerfil: idPerfil,
        ),
      );
      return LoginResponseDto.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw mapAuthApiError(e, duringLogin: true);
    }
  }

  Future<List<CondominioVinculoDto>> listarVinculosAtivos() async {
    try {
      final response = await _dio.get<dynamic>(ApiPaths.authVinculosAtivos);
      final data = response.data;
      if (data is! List) return const [];
      return data
          .map(
            (e) => CondominioVinculoDto.fromJson(e as Map<String, dynamic>),
          )
          .toList();
    } on DioException catch (e) {
      throw mapAuthApiError(e, duringLogin: false);
    }
  }

  Future<List<MinhaUnidadeDto>> listarMinhasUnidades() async {
    try {
      final response = await _dio.get<dynamic>(ApiPaths.authMinhasUnidades);
      final data = response.data;
      if (data is! List) return const [];
      return data
          .map(
            (e) => MinhaUnidadeDto.fromJson(e as Map<String, dynamic>),
          )
          .toList();
    } on DioException catch (e) {
      throw mapAuthApiError(e, duringLogin: false);
    }
  }

  Future<LoginResponseDto> trocarCondominio({
    required int idCondominio,
    int? idPerfil,
  }) async {
    try {
      final body = <String, dynamic>{'idCondominio': idCondominio};
      if (idPerfil != null) {
        body['idPerfil'] = idPerfil;
      }
      final response = await _dio.post<dynamic>(
        ApiPaths.authTrocarCondominio,
        data: body,
      );
      return LoginResponseDto.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw mapAuthApiError(e, duringLogin: false);
    }
  }

  Future<LoginResponseDto> trocarPerfil({required int idPerfil}) async {
    try {
      final response = await _dio.post<dynamic>(
        ApiPaths.authTrocarPerfil,
        data: {'idPerfil': idPerfil},
      );
      return LoginResponseDto.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw mapAuthApiError(e, duringLogin: false);
    }
  }
}