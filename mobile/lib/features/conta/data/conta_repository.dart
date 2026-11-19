import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_paths.dart';
import '../../../core/network/dio_provider.dart';
import 'perfil_conta_models.dart';
import 'preferencia_notificacao_models.dart';

final contaRepositoryProvider = Provider<ContaRepository>((ref) {
  return ContaRepository(ref.watch(dioProvider));
});

class ContaRepository {
  ContaRepository(this._dio);

  final Dio _dio;

  Future<PerfilConta> obterPerfil() async {
    final resp = await _dio.get<Map<String, dynamic>>(ApiPaths.contaPerfil);
    return PerfilConta.fromJson(resp.data ?? const {});
  }

  Future<Uint8List?> baixarFotoPerfil() async {
    final resp = await _dio.get<Uint8List>(
      ApiPaths.contaFoto,
      queryParameters: {'v': DateTime.now().millisecondsSinceEpoch},
      options: Options(responseType: ResponseType.bytes),
    );
    final bytes = resp.data;
    if (bytes == null || bytes.isEmpty) return null;
    return bytes;
  }

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

  Future<PreferenciaNotificacaoLista> listarPreferenciasNotificacao() async {
    final resp = await _dio.get<Map<String, dynamic>>(
      ApiPaths.contaPreferenciasNotificacao,
    );
    return PreferenciaNotificacaoLista.fromJson(resp.data ?? const {});
  }

  Future<PreferenciaNotificacaoLista> salvarPreferenciasNotificacao(
    List<PreferenciaNotificacaoCategoria> preferencias,
  ) async {
    final resp = await _dio.put<Map<String, dynamic>>(
      ApiPaths.contaPreferenciasNotificacao,
      data: {
        'preferencias': preferencias.map((p) => p.toSalvarJson()).toList(),
      },
    );
    return PreferenciaNotificacaoLista.fromJson(resp.data ?? const {});
  }
}