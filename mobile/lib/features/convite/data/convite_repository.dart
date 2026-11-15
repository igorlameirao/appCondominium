import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';
import '../../../core/network/api_paths.dart';

final conviteRepositoryProvider = Provider<ConviteRepository>((ref) {
  return ConviteRepository(ref.watch(dioProvider));
});

class ValidarConviteResult {
  ValidarConviteResult({
    required this.valido,
    required this.mensagem,
    required this.requerAutenticacao,
    required this.requerDefinirSenha,
    this.nomeCondominio,
  });

  final bool valido;
  final String mensagem;
  final bool requerAutenticacao;
  final bool requerDefinirSenha;
  final String? nomeCondominio;

  factory ValidarConviteResult.fromJson(Map<String, dynamic> json) {
    return ValidarConviteResult(
      valido: json['valido'] == true,
      mensagem: json['mensagem']?.toString() ?? '',
      requerAutenticacao: json['requerAutenticacao'] == true,
      requerDefinirSenha: json['requerDefinirSenha'] == true,
      nomeCondominio: json['nomeCondominio']?.toString(),
    );
  }
}

class ConviteRepository {
  ConviteRepository(this._dio);

  final Dio _dio;

  Future<ValidarConviteResult> validar(String token) async {
    final res = await _dio.get<Map<String, dynamic>>(
      ApiPaths.convitesValidar,
      queryParameters: {'token': token},
    );
    return ValidarConviteResult.fromJson(res.data ?? {});
  }

  Future<String> aceitarContaNova({
    required String token,
    required String nome,
    required String cpf,
    required String email,
    required String dataNascimento,
    required String senha,
    String? telefone,
  }) async {
    final res = await _dio.post<Map<String, dynamic>>(
      ApiPaths.convitesAceitar,
      data: {
        'token': token,
        'nome': nome,
        'cpf': cpf,
        'email': email,
        'dataNascimento': dataNascimento,
        'senha': senha,
        'telefone': ?telefone,
      },
    );
    return res.data?['mensagem']?.toString() ?? 'Conta ativada.';
  }

  Future<String> aceitarAutenticado(String token) async {
    final res = await _dio.post<Map<String, dynamic>>(
      ApiPaths.convitesAceitar,
      data: {'token': token, 'modo': 'autenticado'},
    );
    return res.data?['mensagem']?.toString() ?? 'Convite aceito.';
  }
}