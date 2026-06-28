import 'package:flutter_guid/flutter_guid.dart';
import 'package:sagaz_condominium/data/view_models/usuario.dart';

class Mensagem {
  Guid id;
  Usuario de;
  Usuario para;
  String titulo;
  String mensagem;
  bool visualizada;
  Mensagem(this.de, this.para, this.id, this.titulo, this.mensagem,
      this.visualizada);
}
