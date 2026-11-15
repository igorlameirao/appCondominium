import 'package:appcondominium_mobile/app/theme/theme_mode_controller.dart';
import 'package:appcondominium_mobile/core/security/secure_key_value_store.dart';
import 'package:appcondominium_mobile/core/security/token_storage.dart';
import 'package:appcondominium_mobile/features/auth/data/models/auth_dtos.dart';
import 'package:appcondominium_mobile/features/home/domain/models/home_models.dart';
import 'package:appcondominium_mobile/features/home/presentation/widgets/home_header.dart';
import 'package:appcondominium_mobile/features/units/application/selected_unit_notifier.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _resident = HomeResidentContext(
  displayName: 'Maria',
  roleLabel: 'Morador',
  unitLabel: 'Apt 101',
);

Widget _headerHarness({
  required List<Override> overrides,
  required String condominiumName,
}) {
  return ProviderScope(
    overrides: [
      tokenStorageProvider.overrideWithValue(
        TokenStorage(InMemorySecureKeyValueStore()),
      ),
      ...overrides,
    ],
    child: MaterialApp(
      home: Scaffold(
        body: HomeHeader(
          condominium: HomeCondominiumSelection(
            id: '1',
            name: condominiumName,
          ),
          notificationCount: 0,
          resident: _resident,
        ),
      ),
    ),
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late SharedPreferences prefs;

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    prefs = await SharedPreferences.getInstance();
  });

  group('HomeHeader troca de condomínio', () {
    testWidgets('um vínculo: exibe nome sem seta de seleção', (tester) async {
      await tester.pumpWidget(
        _headerHarness(
          condominiumName: 'Condomínio Alpha',
          overrides: [
            sharedPreferencesProvider.overrideWithValue(prefs),
            vinculosAtivosProvider.overrideWith(
              (ref) async => const [
                CondominioVinculoDto(
                  idCondominio: 1,
                  nome: 'Condomínio Alpha',
                  perfis: [],
                ),
              ],
            ),
          ],
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Condomínio Alpha'), findsOneWidget);
      expect(find.byIcon(Icons.keyboard_arrow_down_rounded), findsNothing);
    });

    testWidgets('vários vínculos: exibe seta e abre seletor ao tocar',
        (tester) async {
      await tester.pumpWidget(
        _headerHarness(
          condominiumName: 'Condomínio Alpha',
          overrides: [
            sharedPreferencesProvider.overrideWithValue(prefs),
            vinculosAtivosProvider.overrideWith(
              (ref) async => const [
                CondominioVinculoDto(
                  idCondominio: 1,
                  nome: 'Condomínio Alpha',
                  perfis: [],
                ),
                CondominioVinculoDto(
                  idCondominio: 2,
                  nome: 'Condomínio Beta',
                  perfis: [],
                ),
              ],
            ),
          ],
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.keyboard_arrow_down_rounded), findsOneWidget);

      await tester.tap(find.text('Condomínio Alpha'));
      await tester.pumpAndSettle();

      expect(find.text('Trocar condomínio'), findsOneWidget);
      expect(find.text('Condomínio Beta'), findsOneWidget);
    });
  });
}