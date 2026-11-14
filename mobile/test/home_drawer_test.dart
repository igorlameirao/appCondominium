import 'package:appcondominium_mobile/app/theme/theme_mode_controller.dart';
import 'package:appcondominium_mobile/features/home/presentation/home_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<void> _openDrawer(WidgetTester tester) async {
  await tester.tap(find.byIcon(Icons.menu_rounded));
  await tester.pumpAndSettle();
}

Widget _homeWithRouter(GoRouter router, {List<Override> overrides = const []}) {
  return ProviderScope(
    overrides: overrides,
    child: MaterialApp.router(
      theme: ThemeData.light(),
      darkTheme: ThemeData.dark(),
      routerConfig: router,
    ),
  );
}

GoRouter _testRouter() {
  return GoRouter(
    initialLocation: '/home',
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const Scaffold(
          body: Center(child: Text('Tela Login')),
        ),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomePage(),
      ),
    ],
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late SharedPreferences prefs;

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    prefs = await SharedPreferences.getInstance();
  });

  group('HomeDrawer', () {
    testWidgets('exibe cabeçalho com dados demonstrativos', (tester) async {
      final router = _testRouter();
      addTearDown(router.dispose);

      await tester.pumpWidget(
        _homeWithRouter(
          router,
          overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
        ),
      );
      await tester.pumpAndSettle();
      await _openDrawer(tester);

      final drawer = find.byType(Drawer);

      expect(
        find.descendant(of: drawer, matching: find.text('Danilo')),
        findsOneWidget,
      );
      expect(
        find.descendant(of: drawer, matching: find.text('Morador')),
        findsOneWidget,
      );
      expect(
        find.descendant(
          of: drawer,
          matching: find.text('Residencial Vista Nobre'),
        ),
        findsOneWidget,
      );
      expect(
        find.descendant(
          of: drawer,
          matching: find.text('Torre A — Apto 302'),
        ),
        findsOneWidget,
      );
    });

    testWidgets('exibe grupos e itens do menu', (tester) async {
      final router = _testRouter();
      addTearDown(router.dispose);

      await tester.pumpWidget(
        _homeWithRouter(
          router,
          overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
        ),
      );
      await tester.pumpAndSettle();
      await _openDrawer(tester);

      final drawer = find.byType(Drawer);

      expect(
        find.descendant(of: drawer, matching: find.text('Meu Condomínio')),
        findsOneWidget,
      );
      expect(
        find.descendant(of: drawer, matching: find.text('Serviços')),
        findsOneWidget,
      );
      expect(find.text('Assembleias e Votações'), findsOneWidget);

      final listView = find.descendant(
        of: drawer,
        matching: find.byType(ListView),
      );
      await tester.drag(listView, const Offset(0, -320));
      await tester.pumpAndSettle();

      expect(
        find.descendant(of: drawer, matching: find.text('Financeiro')),
        findsOneWidget,
      );
      expect(find.text('Taxas e Boletos'), findsOneWidget);
    });

    testWidgets('item não implementado exibe mensagem demonstrativa', (
      tester,
    ) async {
      final router = _testRouter();
      addTearDown(router.dispose);

      await tester.pumpWidget(
        _homeWithRouter(
          router,
          overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
        ),
      );
      await tester.pumpAndSettle();
      await _openDrawer(tester);

      await tester.tap(find.text('Comunicados'));
      await tester.pumpAndSettle();

      expect(
        find.text('Funcionalidade disponível em breve'),
        findsOneWidget,
      );
    });

    testWidgets('seletor de aparência altera tema e persiste', (tester) async {
      final router = _testRouter();
      addTearDown(router.dispose);

      await tester.pumpWidget(
        _homeWithRouter(
          router,
          overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
        ),
      );
      await tester.pumpAndSettle();
      await _openDrawer(tester);

      expect(find.text('Aparência'), findsOneWidget);
      await tester.tap(find.text('Escuro'));
      await tester.pumpAndSettle();

      expect(prefs.getString('app_theme_mode'), 'dark');

      await tester.tap(find.text('Claro'));
      await tester.pumpAndSettle();

      expect(prefs.getString('app_theme_mode'), 'light');
    });

    testWidgets('menu lateral exibe Sair da conta e navega para login', (
      tester,
    ) async {
      final router = _testRouter();
      addTearDown(router.dispose);

      await tester.pumpWidget(
        _homeWithRouter(
          router,
          overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
        ),
      );
      await tester.pumpAndSettle();

      await _openDrawer(tester);

      expect(find.text('Sair da conta'), findsOneWidget);
      expect(find.byIcon(Icons.logout_rounded), findsOneWidget);

      await tester.tap(find.text('Sair da conta'));
      await tester.pumpAndSettle();

      expect(find.text('Tela Login'), findsOneWidget);
      expect(find.text('Minhas Pendências'), findsNothing);
    });

    testWidgets('voltar após sair não retorna à Home', (tester) async {
      final router = _testRouter();
      addTearDown(router.dispose);

      await tester.pumpWidget(
        _homeWithRouter(
          router,
          overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
        ),
      );
      await tester.pumpAndSettle();

      await _openDrawer(tester);
      await tester.tap(find.text('Sair da conta'));
      await tester.pumpAndSettle();

      expect(router.canPop(), isFalse);
      expect(find.text('Tela Login'), findsOneWidget);
      expect(find.text('Minhas Pendências'), findsNothing);
    });

    testWidgets('drawer sem overflow em tela compacta', (tester) async {
      final router = _testRouter();
      addTearDown(router.dispose);

      tester.view.physicalSize = const Size(360, 640);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        _homeWithRouter(
          router,
          overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
        ),
      );
      await tester.pumpAndSettle();
      await _openDrawer(tester);

      expect(tester.takeException(), isNull);
      await tester.drag(find.byType(Drawer), const Offset(0, -120));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });
  });
}