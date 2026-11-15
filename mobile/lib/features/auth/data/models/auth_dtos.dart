import '../../domain/login_destino.dart';

/// Contrato `CredenciaisRequest` / corpo de `POST /api/auth/vinculos`.
Map<String, dynamic> credenciaisRequestToJson({
  required String usuario,
  required String senha,
}) =>
    {'usuario': usuario, 'senha': senha};

/// Contrato `LoginRequest` / corpo de `POST /api/auth/login`.
Map<String, dynamic> loginRequestToJson({
  required String usuario,
  required String senha,
  required int idCondominio,
  int? idPerfil,
}) {
  final map = <String, dynamic>{
    'usuario': usuario,
    'senha': senha,
    'idCondominio': idCondominio,
  };
  if (idPerfil != null) {
    map['idPerfil'] = idPerfil;
  }
  return map;
}

/// Contrato `LoginResponse`.
class LoginResponseDto {
  const LoginResponseDto({
    required this.token,
    required this.idCondominio,
    required this.perfil,
    required this.nome,
    required this.acessoTotal,
    required this.permissoes,
  });

  final String token;
  final int idCondominio;
  final String perfil;
  final String nome;
  final bool acessoTotal;
  final List<String> permissoes;

  factory LoginResponseDto.fromJson(Map<String, dynamic> json) {
    final permissoesRaw = json['permissoes'];
    return LoginResponseDto(
      token: json['token'] as String,
      idCondominio: (json['idCondominio'] as num).toInt(),
      perfil: json['perfil'] as String,
      nome: json['nome'] as String,
      acessoTotal: json['acessoTotal'] as bool,
      permissoes: permissoesRaw is List
          ? permissoesRaw.map((e) => e.toString()).toList()
          : const [],
    );
  }
}

class CondominioVinculoDto {
  const CondominioVinculoDto({
    required this.idCondominio,
    required this.nome,
    required this.perfis,
    this.dominio,
  });

  final int idCondominio;
  final String nome;
  final List<PerfilVinculoDto> perfis;
  final String? dominio;

  factory CondominioVinculoDto.fromJson(Map<String, dynamic> json) {
    final perfisRaw = json['perfis'] as List<dynamic>? ?? const [];
    return CondominioVinculoDto(
      idCondominio: (json['idCondominio'] as num).toInt(),
      nome: json['nome'] as String,
      perfis: perfisRaw
          .map((e) => PerfilVinculoDto.fromJson(e as Map<String, dynamic>))
          .toList(),
      dominio: json['dominio'] as String?,
    );
  }

  CondominioVinculo toDomain() => CondominioVinculo(
        idCondominio: idCondominio,
        nome: nome,
        dominio: dominio,
        perfis: perfis
            .map(
              (p) => PerfilVinculo(idPerfil: p.idPerfil, nome: p.nome),
            )
            .toList(),
      );
}

class MinhaUnidadeDto {
  const MinhaUnidadeDto({
    required this.idUnidade,
    required this.descricao,
  });

  final int idUnidade;
  final String descricao;

  factory MinhaUnidadeDto.fromJson(Map<String, dynamic> json) =>
      MinhaUnidadeDto(
        idUnidade: (json['idUnidade'] as num).toInt(),
        descricao: json['descricao'] as String,
      );
}

class PerfilVinculoDto {
  const PerfilVinculoDto({required this.idPerfil, required this.nome});

  final int idPerfil;
  final String nome;

  factory PerfilVinculoDto.fromJson(Map<String, dynamic> json) =>
      PerfilVinculoDto(
        idPerfil: (json['idPerfil'] as num).toInt(),
        nome: json['nome'] as String,
      );
}