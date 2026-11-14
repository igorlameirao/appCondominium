import 'package:appcondominium_mobile/features/home/presentation/home_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Future<void> pumpHome(
    WidgetTester tester, {
    required double logicalWidth,
    Brightness brightness = Brightness.light,
  }) async {
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    tester.view.physicalSize = Size(logicalWidth, 800);
    tester.view.devicePixelRatio = 1.0;

    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          theme: ThemeData(brightness: brightness, useMaterial3: true),
          home: const HomePage(),
        ),
      ),
    );
    await tester.pumpAndSettle();
  }

  for (final width in const [360.0, 393.0, 430.0]) {
    testWidgets(
      'Home tema claro sem overflow em ${width.toInt()}dp',
      (tester) async {
        await pumpHome(tester, logicalWidth: width);
        expect(tester.takeException(), isNull);
        expect(find.text('Minhas Pendências'), findsOneWidget);
        expect(find.text('Encomendas'), findsOneWidget);
        expect(find.textContaining('Ver todas'), findsOneWidget);
        expect(find.text('Autorização de visita'), findsNothing);
        expect(find.text('Fique por dentro das novidades'), findsNothing);
        expect(find.text('Assembleia Geral Ordinária'), findsOneWidget);
        expect(find.text('Assembleia'), findsOneWidget);
      },
    );

    testWidgets(
      'Home tema escuro sem overflow em ${width.toInt()}dp',
      (tester) async {
        await pumpHome(
          tester,
          logicalWidth: width,
          brightness: Brightness.dark,
        );
        expect(tester.takeException(), isNull);
        expect(find.text('Acesso Rápido'), findsOneWidget);
      },
    );
  }
}
