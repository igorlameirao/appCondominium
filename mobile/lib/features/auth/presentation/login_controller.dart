import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors/app_failure.dart';
import '../../units/application/selected_unit_notifier.dart';
import '../application/auth_session_notifier.dart';
import '../data/auth_repository.dart';
import '../domain/login_destino.dart';
import '../domain/usuario_input.dart';

enum LoginUiState {
  idle,
  loading,
  error,
}

enum LoginStep {
  credentials,
  selectCondominio,
  selectPerfil,
}

class LoginFormState {
  const LoginFormState({
    this.uiState = LoginUiState.idle,
    this.step = LoginStep.credentials,
    this.vinculos = const [],
    this.pendingCondominioId,
    this.errorMessage,
  });

  final LoginUiState uiState;
  final LoginStep step;
  final List<CondominioVinculo> vinculos;
  final int? pendingCondominioId;
  final String? errorMessage;

  bool get isLoading => uiState == LoginUiState.loading;

  List<PerfilVinculo> get perfisDoCondominioPendente {
    final id = pendingCondominioId;
    if (id == null) return const [];
    for (final v in vinculos) {
      if (v.idCondominio == id) return v.perfis;
    }
    return const [];
  }

  String? get nomeCondominioPendente {
    final id = pendingCondominioId;
    if (id == null) return null;
    for (final v in vinculos) {
      if (v.idCondominio == id) return v.nome;
    }
    return null;
  }

  LoginFormState copyWith({
    LoginUiState? uiState,
    LoginStep? step,
    List<CondominioVinculo>? vinculos,
    int? pendingCondominioId,
    String? errorMessage,
    bool clearError = false,
    bool clearPendingCondominio = false,
  }) {
    return LoginFormState(
      uiState: uiState ?? this.uiState,
      step: step ?? this.step,
      vinculos: vinculos ?? this.vinculos,
      pendingCondominioId:
          clearPendingCondominio ? null : (pendingCondominioId ?? this.pendingCondominioId),
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

final loginControllerProvider =
    NotifierProvider<LoginController, LoginFormState>(LoginController.new);

class LoginController extends Notifier<LoginFormState> {
  @override
  LoginFormState build() {
    ref.onDispose(_clearSensitive);
    return const LoginFormState();
  }

  String? _usuario;
  String? _senha;

  AuthRepository get _repository => ref.read(authRepositoryProvider);

  void _clearSensitive() {
    _senha = null;
  }

  Future<bool> submit({
    required String usuarioRaw,
    required String senha,
  }) async {
    if (state.isLoading) return false;

    final usuario = normalizarUsuario(usuarioRaw);
    if (!usuarioPreenchido(usuario) || senha.isEmpty) {
      state = const LoginFormState(
        uiState: LoginUiState.error,
        errorMessage: 'Informe e-mail ou CPF e a senha.',
      );
      return false;
    }

    _usuario = usuario;
    _senha = senha;
    state = const LoginFormState(uiState: LoginUiState.loading);

    try {
      final vinculosDto = await _repository.listarVinculos(
        usuario: usuario,
        senha: senha,
      );
      final vinculos = vinculosDto.map((e) => e.toDomain()).toList();
      return _handleDestino(destinoAposCredenciais(vinculos), vinculos);
    } on InvalidCredentialsFailure catch (e) {
      return _failAndClearSenha(e.message);
    } on NetworkFailure catch (e) {
      return _failAndClearSenha(e.message);
    } on ForbiddenFailure catch (e) {
      return _failAndClearSenha(e.message);
    } on AppFailure catch (e) {
      return _failAndClearSenha(e.message);
    } catch (_) {
      return _failAndClearSenha(
        'Não foi possível concluir o login. Tente novamente.',
      );
    }
  }

  Future<bool> selectCondominio(int idCondominio) async {
    if (state.isLoading || _usuario == null || _senha == null) return false;
    final condo = state.vinculos.firstWhere(
      (v) => v.idCondominio == idCondominio,
      orElse: () => const CondominioVinculo(
        idCondominio: -1,
        nome: '',
        perfis: [],
      ),
    );
    if (condo.idCondominio < 0) {
      state = state.copyWith(
        uiState: LoginUiState.error,
        errorMessage: 'Condomínio inválido.',
      );
      return false;
    }

    return _handleDestino(
      destinoAposCondominio(condo),
      state.vinculos,
      overrideCondominioId: idCondominio,
    );
  }

  Future<bool> selectPerfil(int idPerfil) async {
    final idCondominio = state.pendingCondominioId;
    if (state.isLoading ||
        _usuario == null ||
        _senha == null ||
        idCondominio == null) {
      return false;
    }
    return _finalizeLogin(
      idCondominio: idCondominio,
      idPerfil: idPerfil,
      condominioNome: state.nomeCondominioPendente,
    );
  }

  void voltar() {
    if (state.isLoading) return;
    state = switch (state.step) {
      LoginStep.selectPerfil => state.copyWith(
          step: state.vinculos.length > 1
              ? LoginStep.selectCondominio
              : LoginStep.credentials,
          clearError: true,
          clearPendingCondominio:
              state.vinculos.length <= 1,
        ),
      LoginStep.selectCondominio => state.copyWith(
          step: LoginStep.credentials,
          clearError: true,
          clearPendingCondominio: true,
        ),
      LoginStep.credentials => state.copyWith(clearError: true),
    };
  }

  void resetMessages() {
    if (state.errorMessage == null) return;
    state = state.copyWith(clearError: true, uiState: LoginUiState.idle);
  }

  Future<bool> _handleDestino(
    DestinoLogin destino,
    List<CondominioVinculo> vinculos, {
    int? overrideCondominioId,
  }) async {
    return switch (destino) {
      DestinoSemVinculo() => _failAndClearSenha(
          'Nenhum vínculo ativo encontrado para este usuário.',
        ),
      DestinoSelecionarCondominio() => _showCondominioStep(vinculos),
      DestinoSelecionarPerfil(:final idCondominio) => _showPerfilStep(
          vinculos,
          overrideCondominioId ?? idCondominio,
        ),
      DestinoAutenticar(
        :final idCondominio,
        :final idPerfil,
        :final condominioNome,
      ) =>
        await _finalizeLogin(
          idCondominio: overrideCondominioId ?? idCondominio,
          idPerfil: idPerfil,
          condominioNome: condominioNome,
        ),
    };
  }

  bool _showCondominioStep(List<CondominioVinculo> vinculos) {
    state = LoginFormState(
      step: LoginStep.selectCondominio,
      vinculos: vinculos,
    );
    return false;
  }

  bool _showPerfilStep(List<CondominioVinculo> vinculos, int idCondominio) {
    state = LoginFormState(
      step: LoginStep.selectPerfil,
      vinculos: vinculos,
      pendingCondominioId: idCondominio,
    );
    return false;
  }

  Future<bool> _finalizeLogin({
    required int idCondominio,
    required int? idPerfil,
    String? condominioNome,
  }) async {
    final usuario = _usuario;
    final senha = _senha;
    if (usuario == null || senha == null) return false;

    state = state.copyWith(uiState: LoginUiState.loading, clearError: true);

    try {
      final response = await _repository.login(
        usuario: usuario,
        senha: senha,
        idCondominio: idCondominio,
        idPerfil: idPerfil,
      );
      await ref.read(authSessionProvider.notifier).applyLoginResponse(
            response,
            condominioNome: condominioNome,
          );
      _clearSensitive();
      state = const LoginFormState();
      await ref.read(selectedUnitProvider.notifier).refreshAfterLogin();
      return true;
    } on InvalidCredentialsFailure catch (e) {
      return _failAndClearSenha(e.message);
    } on NetworkFailure catch (e) {
      return _failAndClearSenha(e.message);
    } on ForbiddenFailure catch (e) {
      return _failAndClearSenha(e.message);
    } on AppFailure catch (e) {
      return _failAndClearSenha(e.message);
    } catch (_) {
      return _failAndClearSenha(
        'Não foi possível concluir o login. Tente novamente.',
      );
    }
  }

  bool _failAndClearSenha(String message) {
    _clearSensitive();
    state = LoginFormState(
      uiState: LoginUiState.error,
      errorMessage: message,
    );
    return false;
  }
}