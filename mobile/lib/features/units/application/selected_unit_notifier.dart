import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/security/jwt_payload.dart';
import '../../auth/application/auth_session_notifier.dart';
import '../../auth/data/auth_repository.dart';
import '../../auth/data/models/auth_dtos.dart';
import '../data/unit_preference_store.dart';

final minhasUnidadesProvider =
    FutureProvider.autoDispose<List<MinhaUnidadeDto>>((ref) async {
  ref.watch(authSessionProvider);
  ref.watch(tenantContextGenerationProvider);
  final session = ref.watch(authSessionProvider);
  if (!session.isAuthenticated) return const [];
  return ref.read(authRepositoryProvider).listarMinhasUnidades();
});

/// Geração observada por [minhasUnidadesProvider] e home após troca de contexto.
final tenantContextGenerationProvider = StateProvider<int>((ref) => 0);

final vinculosAtivosProvider =
    FutureProvider.autoDispose<List<CondominioVinculoDto>>((ref) async {
  ref.watch(authSessionProvider);
  ref.watch(tenantContextGenerationProvider);
  final session = ref.watch(authSessionProvider);
  if (!session.isAuthenticated) return const [];
  return ref.read(authRepositoryProvider).listarVinculosAtivos();
});

class SelectedUnitState {
  const SelectedUnitState({
    this.selected,
    this.isResolving = false,
  });

  final MinhaUnidadeDto? selected;
  final bool isResolving;

  String get displayLabel =>
      selected?.descricao ?? 'Sem unidade vinculada';

  SelectedUnitState copyWith({
    MinhaUnidadeDto? selected,
    bool? isResolving,
    bool clearSelection = false,
  }) {
    return SelectedUnitState(
      selected: clearSelection ? null : (selected ?? this.selected),
      isResolving: isResolving ?? this.isResolving,
    );
  }
}

final selectedUnitProvider =
    NotifierProvider<SelectedUnitNotifier, SelectedUnitState>(
  SelectedUnitNotifier.new,
);

class SelectedUnitNotifier extends Notifier<SelectedUnitState> {
  @override
  SelectedUnitState build() {
    ref.listen<AsyncValue<List<MinhaUnidadeDto>>>(minhasUnidadesProvider,
        (previous, next) {
      next.whenData(_resolveFromRemoteList);
    });
    return const SelectedUnitState(isResolving: true);
  }

  UnitPreferenceStore get _prefs => ref.read(unitPreferenceStoreProvider);

  Future<void> refreshAfterLogin() async {
    state = const SelectedUnitState(isResolving: true);
    ref.invalidate(minhasUnidadesProvider);
  }

  void resetForTenantChange() {
    state = const SelectedUnitState(isResolving: true);
    ref.read(tenantContextGenerationProvider.notifier).state++;
    ref.invalidate(minhasUnidadesProvider);
    ref.invalidate(vinculosAtivosProvider);
  }

  Future<void> selectUnit(MinhaUnidadeDto unit) async {
    final session = ref.read(authSessionProvider);
    final token = session.token;
    if (token == null) return;
    final claims = JwtPayload.fromToken(token);
    final idPessoa = claims?.idPessoa;
    final idCondominio = session.idCondominio;
    if (idPessoa == null || idCondominio == null) return;

    state = SelectedUnitState(selected: unit);
    await _prefs.writePreferredUnitId(
      idPessoa: idPessoa,
      idCondominio: idCondominio,
      idUnidade: unit.idUnidade,
    );
    ref.read(tenantContextGenerationProvider.notifier).state++;
  }

  void _resolveFromRemoteList(List<MinhaUnidadeDto> unidades) {
    if (unidades.isEmpty) {
      state = const SelectedUnitState();
      return;
    }
    if (unidades.length == 1) {
      state = SelectedUnitState(selected: unidades.first);
      _persistIfPossible(unidades.first);
      return;
    }

    final session = ref.read(authSessionProvider);
    final claims = JwtPayload.fromToken(session.token ?? '');
    final idPessoa = claims?.idPessoa;
    final idCondominio = session.idCondominio;
    final preferred = idPessoa != null && idCondominio != null
        ? _prefs.readPreferredUnitId(
            idPessoa: idPessoa,
            idCondominio: idCondominio,
          )
        : null;

    MinhaUnidadeDto? match;
    if (preferred != null) {
      for (final u in unidades) {
        if (u.idUnidade == preferred) {
          match = u;
          break;
        }
      }
    }
    state = SelectedUnitState(selected: match);
  }

  Future<void> _persistIfPossible(MinhaUnidadeDto unit) async {
    final session = ref.read(authSessionProvider);
    final claims = JwtPayload.fromToken(session.token ?? '');
    final idPessoa = claims?.idPessoa;
    final idCondominio = session.idCondominio;
    if (idPessoa == null || idCondominio == null) return;
    await _prefs.writePreferredUnitId(
      idPessoa: idPessoa,
      idCondominio: idCondominio,
      idUnidade: unit.idUnidade,
    );
  }
}