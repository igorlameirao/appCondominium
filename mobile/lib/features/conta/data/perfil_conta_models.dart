class PerfilConta {
  const PerfilConta({
    required this.nome,
    required this.perfil,
    required this.temFoto,
    this.email,
  });

  final String nome;
  final String perfil;
  final bool temFoto;
  final String? email;

  factory PerfilConta.fromJson(Map<String, dynamic> json) {
    return PerfilConta(
      nome: (json['nome'] as String?)?.trim() ?? 'Usuário',
      perfil: (json['perfil'] as String?)?.trim() ?? '',
      temFoto: json['temFoto'] == true,
      email: (json['email'] as String?)?.trim(),
    );
  }
}