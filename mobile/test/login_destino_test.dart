import 'package:appcondominium_mobile/features/auth/domain/login_destino.dart';
import 'package:flutter_test/flutter_test.dart';

CondominioVinculo _condo(int id, List<int> perfilIds) => CondominioVinculo(
      idCondominio: id,
      nome: 'Condomínio $id',
      perfis: perfilIds
          .map((p) => PerfilVinculo(idPerfil: p, nome: 'Perfil $p'))
          .toList(),
    );

void main() {
  group('destinoAposCredenciais', () {
    test('lista vazia retorna sem vínculo', () {
      expect(destinoAposCredenciais([]), isA<DestinoSemVinculo>());
    });

    test('um condomínio com um perfil autentica', () {
      final destino = destinoAposCredenciais([_condo(1, [3])]);
      expect(destino, isA<DestinoAutenticar>());
      final auth = destino as DestinoAutenticar;
      expect(auth.idCondominio, 1);
      expect(auth.idPerfil, 3);
    });

    test('vários condomínios exige seleção', () {
      final destino = destinoAposCredenciais([
        _condo(1, [1]),
        _condo(2, [2]),
      ]);
      expect(destino, isA<DestinoSelecionarCondominio>());
    });
  });

  group('destinoAposCondominio', () {
    test('vários perfis exige seleção de perfil', () {
      final destino = destinoAposCondominio(_condo(5, [1, 2]));
      expect(destino, isA<DestinoSelecionarPerfil>());
      expect((destino as DestinoSelecionarPerfil).idCondominio, 5);
    });

    test('nenhum perfil autentica com idPerfil nulo (padrão do servidor)', () {
      final destino = destinoAposCondominio(
        const CondominioVinculo(idCondominio: 7, nome: 'C', perfis: []),
      );
      expect(destino, isA<DestinoAutenticar>());
      expect((destino as DestinoAutenticar).idPerfil, isNull);
    });
  });
}