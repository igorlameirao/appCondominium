import 'package:appcondominium_mobile/core/errors/app_failure.dart';
import 'package:appcondominium_mobile/core/security/secure_key_value_store.dart';
import 'package:appcondominium_mobile/core/security/token_storage.dart';
import 'package:appcondominium_mobile/features/auth/application/auth_session_notifier.dart';
import 'package:appcondominium_mobile/features/auth/data/auth_repository.dart';
import 'package:appcondominium_mobile/features/auth/data/models/auth_dtos.dart';
import 'package:appcondominium_mobile/features/auth/presentation/login_controller.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeAuthRepository extends AuthRepository {
  _FakeAuthRepository({
    required this.vinculos,
    this.loginResponse,
    this.vinculosError,
  }) : super(Dio(BaseOptions(baseUrl: 'http://test')));

  final List<CondominioVinculoDto> vinculos;
  final LoginResponseDto? loginResponse;
  final AppFailure? vinculosError;

  @override
  Future<List<CondominioVinculoDto>> listarVinculos({
    required String usuario,
    required String senha,
  }) async {
    if (vinculosError != null) throw vinculosError!;
    return vinculos;
  }

  @override
  Future<LoginResponseDto> login({
    required String usuario,
    required String senha,
    required int idCondominio,
    int? idPerfil,
  }) async {
    return loginResponse!;
  }
}

ProviderContainer _container(AuthRepository repository) {
  final memory = InMemorySecureKeyValueStore();
  return ProviderContainer(
    overrides: [
      authRepositoryProvider.overrideWithValue(repository),
      tokenStorageProvider.overrideWithValue(TokenStorage(memory)),
    ],
  );
}

LoginResponseDto _loginDto() => const LoginResponseDto(
      token: 'jwt',
      idCondominio: 1,
      perfil: 'Morador',
      nome: 'Maria',
      acessoTotal: false,
      permissoes: [],
    );

void main() {
  test('credenciais inválidas na API não autenticam', () async {
    final container = _container(
      _FakeAuthRepository(
        vinculos: const [],
        loginResponse: _loginDto(),
        vinculosError: const InvalidCredentialsFailure('inválido'),
      ),
    );
    addTearDown(container.dispose);

    final ok = await container
        .read(loginControllerProvider.notifier)
        .submit(usuarioRaw: 'a@a.com', senha: 'x');
    expect(ok, isFalse);
    expect(container.read(loginControllerProvider).errorMessage, 'inválido');
    expect(container.read(authSessionProvider).isAuthenticated, isFalse);
  });

  test('um condomínio e um perfil concluem login (CPF com máscara)', () async {
    final container = _container(
      _FakeAuthRepository(
        vinculos: [
          CondominioVinculoDto(
            idCondominio: 1,
            nome: 'C1',
            perfis: [PerfilVinculoDto(idPerfil: 2, nome: 'Morador')],
          ),
        ],
        loginResponse: _loginDto(),
      ),
    );
    addTearDown(container.dispose);

    final ok = await container
        .read(loginControllerProvider.notifier)
        .submit(usuarioRaw: '529.982.247-25', senha: 'Senha@123');
    expect(ok, isTrue);
    expect(container.read(authSessionProvider).isAuthenticated, isTrue);
    expect(container.read(authSessionProvider).nome, 'Maria');
  });

  test('múltiplos condomínios não autenticam arbitrariamente', () async {
    final container = _container(
      _FakeAuthRepository(
        vinculos: [
          CondominioVinculoDto(
            idCondominio: 1,
            nome: 'A',
            perfis: [PerfilVinculoDto(idPerfil: 1, nome: 'X')],
          ),
          CondominioVinculoDto(
            idCondominio: 2,
            nome: 'B',
            perfis: [PerfilVinculoDto(idPerfil: 2, nome: 'Y')],
          ),
        ],
        loginResponse: _loginDto(),
      ),
    );
    addTearDown(container.dispose);

    final ok = await container
        .read(loginControllerProvider.notifier)
        .submit(usuarioRaw: 'user@test.com', senha: 'x');
    expect(ok, isFalse);
    expect(
      container.read(loginControllerProvider).step,
      LoginStep.selectCondominio,
    );
    expect(container.read(authSessionProvider).isAuthenticated, isFalse);
  });

  test('dois perfis no condomínio abre seleção de perfil', () async {
    final container = _container(
      _FakeAuthRepository(
        vinculos: [
          CondominioVinculoDto(
            idCondominio: 1,
            nome: 'C1',
            perfis: [
              PerfilVinculoDto(idPerfil: 1, nome: 'Admin'),
              PerfilVinculoDto(idPerfil: 2, nome: 'Morador'),
            ],
          ),
        ],
        loginResponse: _loginDto(),
      ),
    );
    addTearDown(container.dispose);

    final ok = await container
        .read(loginControllerProvider.notifier)
        .submit(usuarioRaw: 'a@a.com', senha: 'ok');
    expect(ok, isFalse);
    expect(
      container.read(loginControllerProvider).step,
      LoginStep.selectPerfil,
    );
  });

  test('logout limpa sessão', () async {
    final container = _container(
      _FakeAuthRepository(
        vinculos: [
          CondominioVinculoDto(
            idCondominio: 1,
            nome: 'C1',
            perfis: [PerfilVinculoDto(idPerfil: 2, nome: 'Morador')],
          ),
        ],
        loginResponse: _loginDto(),
      ),
    );
    addTearDown(container.dispose);

    await container
        .read(loginControllerProvider.notifier)
        .submit(usuarioRaw: 'a@a.com', senha: 'ok');
    await container.read(authSessionProvider.notifier).logout();
    expect(container.read(authSessionProvider).isAuthenticated, isFalse);
  });
}