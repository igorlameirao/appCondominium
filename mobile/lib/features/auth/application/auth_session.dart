import '../../../core/security/stored_session.dart';

enum AuthStatus {
  unknown,
  unauthenticated,
  authenticated,
}

class AuthSession {
  const AuthSession({
    required this.status,
    this.token,
    this.idCondominio,
    this.condominioNome,
    this.nome,
    this.perfil,
    this.acessoTotal = false,
    this.permissoes = const [],
    this.sessionExpiredNotice = false,
  });

  const AuthSession.unknown() : this(status: AuthStatus.unknown);

  const AuthSession.unauthenticated({bool sessionExpiredNotice = false})
      : this(
          status: AuthStatus.unauthenticated,
          sessionExpiredNotice: sessionExpiredNotice,
        );

  const AuthSession.authenticated({
    required String token,
    required int idCondominio,
    required String nome,
    required String perfil,
    required bool acessoTotal,
    required List<String> permissoes,
    String? condominioNome,
  }) : this(
          status: AuthStatus.authenticated,
          token: token,
          idCondominio: idCondominio,
          condominioNome: condominioNome,
          nome: nome,
          perfil: perfil,
          acessoTotal: acessoTotal,
          permissoes: permissoes,
        );

  final AuthStatus status;
  final String? token;
  final int? idCondominio;
  final String? condominioNome;
  final String? nome;
  final String? perfil;
  final bool acessoTotal;
  final List<String> permissoes;
  final bool sessionExpiredNotice;

  bool get isAuthenticated =>
      status == AuthStatus.authenticated &&
      token != null &&
      token!.isNotEmpty &&
      idCondominio != null;

  StoredSession toStoredSession() => StoredSession(
        idCondominio: idCondominio!,
        condominioNome: condominioNome,
        nome: nome ?? '',
        perfil: perfil ?? '',
        acessoTotal: acessoTotal,
        permissoes: permissoes,
      );

  AuthSession copyWith({
    AuthStatus? status,
    String? token,
    int? idCondominio,
    String? condominioNome,
    String? nome,
    String? perfil,
    bool? acessoTotal,
    List<String>? permissoes,
    bool? sessionExpiredNotice,
  }) {
    return AuthSession(
      status: status ?? this.status,
      token: token ?? this.token,
      idCondominio: idCondominio ?? this.idCondominio,
      condominioNome: condominioNome ?? this.condominioNome,
      nome: nome ?? this.nome,
      perfil: perfil ?? this.perfil,
      acessoTotal: acessoTotal ?? this.acessoTotal,
      permissoes: permissoes ?? this.permissoes,
      sessionExpiredNotice: sessionExpiredNotice ?? this.sessionExpiredNotice,
    );
  }
}