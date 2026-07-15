import 'package:sagaz_condominium/enums/perfil.dart';

class Usuario {
  String id;
  String email = '';
  String primeiroNome = '';
  String nomesMeio = '';
  String nomeFinal = '';
  String senha = '';
  bool isBetaTester = false;
  List<Perfil> perfis = [];
  Usuario(this.id, this.email, this.primeiroNome, this.nomesMeio,
      this.nomeFinal, this.senha, this.isBetaTester, this.perfis);
}
