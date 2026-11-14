import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../app/theme/theme_mode_controller.dart';

final unitPreferenceStoreProvider = Provider<UnitPreferenceStore>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return UnitPreferenceStore(prefs);
});

class UnitPreferenceStore {
  UnitPreferenceStore(this._prefs);

  final SharedPreferences _prefs;

  static String _key(int idPessoa, int idCondominio) =>
      'unit_pref_${idPessoa}_$idCondominio';

  int? readPreferredUnitId({
    required int idPessoa,
    required int idCondominio,
  }) {
    return _prefs.getInt(_key(idPessoa, idCondominio));
  }

  Future<void> writePreferredUnitId({
    required int idPessoa,
    required int idCondominio,
    required int idUnidade,
  }) async {
    await _prefs.setInt(_key(idPessoa, idCondominio), idUnidade);
  }

  Future<void> clearPreferredUnit({
    required int idPessoa,
    required int idCondominio,
  }) async {
    await _prefs.remove(_key(idPessoa, idCondominio));
  }
}