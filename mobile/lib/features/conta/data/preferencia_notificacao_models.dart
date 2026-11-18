class PreferenciaNotificacaoCategoria {
  PreferenciaNotificacaoCategoria({
    required this.codigoTipo,
    required this.descricao,
    required this.modulo,
    required this.ordem,
    required this.obrigatoria,
    required this.pushDisponivel,
    required this.emailDisponivel,
    required this.ativoPush,
    required this.ativoEmail,
  });

  final String codigoTipo;
  final String descricao;
  final String modulo;
  final int ordem;
  final bool obrigatoria;
  final bool pushDisponivel;
  final bool emailDisponivel;
  bool ativoPush;
  bool ativoEmail;

  factory PreferenciaNotificacaoCategoria.fromJson(Map<String, dynamic> json) {
    return PreferenciaNotificacaoCategoria(
      codigoTipo: json['codigoTipo'] as String,
      descricao: json['descricao'] as String,
      modulo: json['modulo'] as String,
      ordem: json['ordem'] as int,
      obrigatoria: json['obrigatoria'] as bool,
      pushDisponivel: json['pushDisponivel'] as bool,
      emailDisponivel: json['emailDisponivel'] as bool,
      ativoPush: json['ativoPush'] as bool,
      ativoEmail: json['ativoEmail'] as bool,
    );
  }

  Map<String, dynamic> toSalvarJson() => {
        'codigoTipo': codigoTipo,
        'ativoPush': ativoPush,
        'ativoEmail': ativoEmail,
      };

  PreferenciaNotificacaoCategoria copiar() {
    return PreferenciaNotificacaoCategoria(
      codigoTipo: codigoTipo,
      descricao: descricao,
      modulo: modulo,
      ordem: ordem,
      obrigatoria: obrigatoria,
      pushDisponivel: pushDisponivel,
      emailDisponivel: emailDisponivel,
      ativoPush: ativoPush,
      ativoEmail: ativoEmail,
    );
  }
}

class PreferenciaNotificacaoLista {
  const PreferenciaNotificacaoLista({required this.categorias});

  final List<PreferenciaNotificacaoCategoria> categorias;

  factory PreferenciaNotificacaoLista.fromJson(Map<String, dynamic> json) {
    final lista = json['categorias'] as List<dynamic>? ?? const [];
    return PreferenciaNotificacaoLista(
      categorias: lista
          .map((e) => PreferenciaNotificacaoCategoria.fromJson(
              e as Map<String, dynamic>))
          .toList(),
    );
  }
}