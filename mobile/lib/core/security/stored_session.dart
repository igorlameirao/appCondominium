import 'dart:convert';

/// Metadados de sessão autenticada (sem senha).
class StoredSession {
  const StoredSession({
    required this.idCondominio,
    required this.nome,
    required this.perfil,
    required this.acessoTotal,
    required this.permissoes,
    this.condominioNome,
  });

  final int idCondominio;
  final String? condominioNome;
  final String nome;
  final String perfil;
  final bool acessoTotal;
  final List<String> permissoes;

  Map<String, dynamic> toJson() => {
        'idCondominio': idCondominio,
        if (condominioNome != null) 'condominioNome': condominioNome,
        'nome': nome,
        'perfil': perfil,
        'acessoTotal': acessoTotal,
        'permissoes': permissoes,
      };

  factory StoredSession.fromJson(Map<String, dynamic> json) {
    final permissoesRaw = json['permissoes'];
    return StoredSession(
      idCondominio: (json['idCondominio'] as num).toInt(),
      condominioNome: json['condominioNome'] as String?,
      nome: json['nome'] as String,
      perfil: json['perfil'] as String,
      acessoTotal: json['acessoTotal'] as bool? ?? false,
      permissoes: permissoesRaw is List
          ? permissoesRaw.map((e) => e.toString()).toList()
          : const [],
    );
  }

  static StoredSession? decode(String? raw) {
    if (raw == null || raw.isEmpty) return null;
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      return StoredSession.fromJson(map);
    } catch (_) {
      return null;
    }
  }

  String encode() => jsonEncode(toJson());
}