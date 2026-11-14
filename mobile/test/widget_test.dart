import 'package:appcondominium_mobile/app/app.dart';
import 'package:appcondominium_mobile/app/bootstrap.dart';
import 'package:appcondominium_mobile/app/theme/theme_mode_controller.dart';
import 'package:appcondominium_mobile/core/config/app_config.dart';
import 'package:appcondominium_mobile/core/config/environment.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('tela de login exibe elementos principais', (tester) async {
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
        ],
        child: const AppCondominiumApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Bem-vindo(a)!'), findsOneWidget);
    expect(find.text('Entrar'), findsOneWidget);
    expect(find.textContaining('App'), findsWidgets);
    expect(find.text('Sistema de Gestão de Condomínios'), findsOneWidget);
  });
}
