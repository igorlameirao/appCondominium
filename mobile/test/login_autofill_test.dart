import 'package:appcondominium_mobile/app/app.dart';
import 'package:appcondominium_mobile/app/bootstrap.dart';
import 'package:appcondominium_mobile/app/theme/theme_mode_controller.dart';
import 'package:appcondominium_mobile/core/config/app_config.dart';
import 'package:appcondominium_mobile/core/config/environment.dart';
import 'package:appcondominium_mobile/core/security/secure_key_value_store.dart';
import 'package:appcondominium_mobile/core/security/token_storage.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'support/pump_splash.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('campos de login expõem hints de autofill nativos', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    const config = AppConfig(
      environment: AppEnvironment.development,
      apiBaseUrl: 'http://localhost:5000',
      enableApiLogging: false,
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appConfigProvider.overrideWithValue(config),
          sharedPreferencesProvider.overrideWithValue(prefs),
          tokenStorageProvider.overrideWithValue(
            TokenStorage(InMemorySecureKeyValueStore()),
          ),
        ],
        child: const AppCondominiumApp(),
      ),
    );
    await tester.pump();
    await pumpPastSplashMinimum(tester);
    await tester.pumpAndSettle();

    expect(find.byType(AutofillGroup), findsOneWidget);

    final fields = tester.widgetList<TextField>(find.byType(TextField));
  final fieldList = fields.toList(growable: false);
    expect(fieldList.length, greaterThanOrEqualTo(2));

    final usuario = fieldList.first;
    expect(
      usuario.autofillHints,
      containsAll([AutofillHints.username, AutofillHints.email]),
    );

    final senha = fieldList[1];
    expect(senha.autofillHints, contains(AutofillHints.password));
    expect(senha.obscureText, isTrue);
    expect(senha.enableSuggestions, isFalse);
  });
}