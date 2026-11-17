import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_paths.dart';
import '../../../core/network/dio_provider.dart';

final contaRepositoryProvider = Provider<ContaRepository>((ref) {
  return ContaRepository(ref.watch(dioProvider));
});

class ContaRepository {
  ContaRepository(this._dio);

  final Dio _dio;

  Future<void> alterarSenha({
    required String senhaAtual,
    required String senhaNova,
  }) async {
    await _dio.put<void>(
      ApiPaths.contaSenha,
      data: {
        'senhaAtual': senhaAtual,
        'senhaNova': senhaNova.trim(),
      },
    );
  }
}