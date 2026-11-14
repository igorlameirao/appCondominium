import 'package:appcondominium_mobile/features/auth/domain/usuario_input.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('e-mail é normalizado para minúsculas', () {
    expect(normalizarUsuario('  Maria@Exemplo.COM '), 'maria@exemplo.com');
  });

  test('CPF mantém máscara para envio à API', () {
    expect(normalizarUsuario('529.982.247-25'), '529.982.247-25');
  });
}