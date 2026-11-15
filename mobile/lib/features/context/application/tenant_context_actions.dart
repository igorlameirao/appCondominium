import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors/app_failure.dart';
import '../../auth/application/auth_session_notifier.dart';
import '../../auth/data/auth_repository.dart';
import '../../auth/domain/login_destino.dart';
import '../../units/application/selected_unit_notifier.dart';
import 'context_invalidation.dart';

final tenantContextActionsProvider = Provider<TenantContextActions>(
  (ref) => TenantContextActions(ref),
);

class TenantContextActions {
  TenantContextActions(this._ref);

  final Ref _ref;

  AuthRepository get _repository => _ref.read(authRepositoryProvider);

  Future<String?> trocarCondominio({
    required int idCondominio,
    int? idPerfil,
    String? condominioNome,
  }) async {
    try {
      final response = await _repository.trocarCondominio(
        idCondominio: idCondominio,
        idPerfil: idPerfil,
      );
      await _ref.read(authSessionProvider.notifier).applyLoginResponse(
            response,
            condominioNome: condominioNome ?? _ref.read(authSessionProvider).condominioNome,
          );
      invalidateTenantScopedCachesFromRef(_ref);
      await _ref.read(selectedUnitProvider.notifier).refreshAfterLogin();
      return null;
    } on AppFailure catch (e) {
      return e.message;
    } catch (_) {
      return 'Não foi possível trocar o condomínio. Tente novamente.';
    }
  }

  Future<String?> trocarPerfil({required int idPerfil}) async {
    try {
      final response = await _repository.trocarPerfil(idPerfil: idPerfil);
      await _ref.read(authSessionProvider.notifier).applyLoginResponse(
            response,
            condominioNome: _ref.read(authSessionProvider).condominioNome,
          );
      invalidateTenantScopedCachesFromRef(_ref);
      await _ref.read(selectedUnitProvider.notifier).refreshAfterLogin();
      return null;
    } on AppFailure catch (e) {
      return e.message;
    } catch (_) {
      return 'Não foi possível trocar o perfil. Tente novamente.';
    }
  }

  /// Decide se a troca de condomínio exige seleção de perfil antes da API.
  DestinoLogin destinoParaCondominio(
    List<CondominioVinculo> vinculos,
    int idCondominio,
  ) =>
      destinoNoTenant(vinculos, idCondominio);
}