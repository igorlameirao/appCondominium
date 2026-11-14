import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _themePreferenceKey = 'app_theme_mode';

final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError(
    'sharedPreferencesProvider deve ser sobrescrito em main.dart',
  );
});

final themeModeControllerProvider =
    NotifierProvider<ThemeModeController, ThemeMode>(ThemeModeController.new);

class ThemeModeController extends Notifier<ThemeMode> {
  @override
  ThemeMode build() {
    final stored =
        ref.read(sharedPreferencesProvider).getString(_themePreferenceKey);
    return _parseThemeMode(stored) ?? ThemeMode.system;
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    state = mode;
    final prefs = ref.read(sharedPreferencesProvider);
    await prefs.setString(_themePreferenceKey, mode.name);
  }

  Future<void> cycleForDemo() async {
    final order = [ThemeMode.light, ThemeMode.dark, ThemeMode.system];
    final index = order.indexOf(state);
    await setThemeMode(order[(index + 1) % order.length]);
  }

  static ThemeMode? _parseThemeMode(String? value) {
    if (value == null) return null;
    for (final mode in ThemeMode.values) {
      if (mode.name == value) return mode;
    }
    return null;
  }
}
