import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_paths.dart';
import '../../../core/network/dio_provider.dart';

final passwordRecoveryRepositoryProvider =
    Provider<PasswordRecoveryRepository>((ref) {
  return PasswordRecoveryRepository(ref.watch(dioProvider));
});

class PasswordRecoveryRepository {
  PasswordRecoveryRepository(this._dio);

  final Dio _dio;

  Future<String> solicitar(String email) async {
    final res = await _dio.post<Map<String, dynamic>>(
      ApiPaths.recuperacaoSenhaSolicitar,
      data: {'email': email.trim()},
    );
    return res.data?['mensagem']?.toString() ??
        'Se o e-mail estiver cadastrado, você receberá instruções em breve.';
  }

  Future<bool> validarToken(String token) async {
    final res = await _dio.get<Map<String, dynamic>>(
      ApiPaths.recuperacaoSenhaValidar,
      queryParameters: {'token': token},
    );
    return res.data?['valido'] == true;
  }

  Future<String> redefinir({
    required String token,
    required String senhaNova,
    required String senhaConfirmacao,
  }) async {
    final res = await _dio.post<Map<String, dynamic>>(
      ApiPaths.recuperacaoSenhaRedefinir,
      data: {
        'token': token,
        'senhaNova': senhaNova,
        'senhaConfirmacao': senhaConfirmacao,
      },
    );
    return res.data?['mensagem']?.toString() ?? 'Senha redefinida com sucesso.';
  }
}