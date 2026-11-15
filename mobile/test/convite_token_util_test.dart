import 'package:flutter_test/flutter_test.dart';
import 'package:appcondominium_mobile/features/convite/data/convite_repository.dart';

void main() {
  test('ValidarConviteResult fromJson interpreta flags', () {
    final r = ValidarConviteResult.fromJson({
      'valido': true,
      'mensagem': 'ok',
      'requerAutenticacao': false,
      'requerDefinirSenha': true,
      'nomeCondominio': 'Alpha',
    });
    expect(r.valido, isTrue);
    expect(r.requerDefinirSenha, isTrue);
    expect(r.nomeCondominio, 'Alpha');
  });
}