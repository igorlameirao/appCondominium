import 'package:appcondominium_mobile/features/auth/data/models/auth_dtos.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('LoginResponseDto.fromJson respeita contrato da API', () {
    final dto = LoginResponseDto.fromJson({
      'token': 'jwt',
      'idCondominio': 12,
      'perfil': 'Morador',
      'nome': 'Maria',
      'acessoTotal': false,
      'permissoes': ['P1', 'P2'],
    });

    expect(dto.token, 'jwt');
    expect(dto.idCondominio, 12);
    expect(dto.perfil, 'Morador');
    expect(dto.nome, 'Maria');
    expect(dto.acessoTotal, isFalse);
    expect(dto.permissoes, ['P1', 'P2']);
  });

  test('CondominioVinculoDto.fromJson respeita contrato da API', () {
    final dto = CondominioVinculoDto.fromJson({
      'idCondominio': 3,
      'nome': 'Residencial',
      'perfis': [
        {'idPerfil': 9, 'nome': 'Síndico'},
      ],
      'dominio': 'residencial.local',
    });

    expect(dto.idCondominio, 3);
    expect(dto.perfis.single.idPerfil, 9);
    expect(dto.dominio, 'residencial.local');
  });

  test('loginRequestToJson omite idPerfil quando nulo', () {
    final json = loginRequestToJson(
      usuario: 'a@b.com',
      senha: 'secret',
      idCondominio: 1,
    );
    expect(json.containsKey('idPerfil'), isFalse);
    expect(json['usuario'], 'a@b.com');
    expect(json['idCondominio'], 1);
  });
}