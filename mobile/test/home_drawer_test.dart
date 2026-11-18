import 'package:appcondominium_mobile/app/theme/theme_mode_controller.dart';
import 'package:appcondominium_mobile/core/security/secure_key_value_store.dart';
import 'package:appcondominium_mobile/core/security/token_storage.dart';
import 'package:appcondominium_mobile/features/auth/presentation/login_page.dart';
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
  final baseOverrides = [
    tokenStorageProvider.overrideWithValue(
      TokenStorage(InMemorySecureKeyValueStore()),
    ),
  ];
  return ProviderScope(
    overrides: [...baseOverrides, ...overrides],
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
        builder: (context, state) => const LoginPage(),
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
    testWidgets('exibe cabeçalho sem dados fictícios quando não autenticado',
        (tester) async {
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

      expect(find.descendant(of: drawer, matching: find.text('Danilo')),
          findsNothing);
      expect(
        find.descendant(of: drawer, matching: find.text('—')),
        findsWidgets,
      );
    });

    testWidgets('exibe itens de troca de contexto', (tester) async {
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

      expect(find.text('Trocar condomínio'), findsOneWidget);
      expect(find.text('Trocar perfil'), findsOneWidget);
      expect(find.text('Trocar unidade'), findsOneWidget);
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
        find.descendant(of: drawer, matching: find.text('Contexto')),
        findsOneWidget,
      );
      expect(
        find.descendant(of: drawer, matching: find.text('Alterar senha')),
        findsNothing,
      );
      expect(find.byTooltip('Configurações da conta'), findsOneWidget);
      expect(
        find.descendant(
          of: drawer,
          matching: find.text('Configurações da conta'),
        ),
        findsNothing,
      );

      final listView = find.descendant(
        of: drawer,
        matching: find.byType(ListView),
      );
      await tester.dragUntilVisible(
        find.text('Serviços'),
        listView,
        const Offset(0, -80),
      );

      expect(find.text('Meu Condomínio'), findsOneWidget);
      expect(find.text('Serviços'), findsOneWidget);
      expect(find.text('Assembleias e Votações'), findsOneWidget);

      await tester.dragUntilVisible(
        find.text('Taxas e Boletos'),
        listView,
        const Offset(0, -80),
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

      final drawer = find.byType(Drawer);
      final listView = find.descendant(
        of: drawer,
        matching: find.byType(ListView),
      );
      await tester.dragUntilVisible(
        find.text('Comunicados'),
        listView,
        const Offset(0, -120),
      );
      final comunicados = find.descendant(
        of: listView,
        matching: find.text('Comunicados'),
      );
      await tester.ensureVisible(comunicados);
      await tester.pumpAndSettle();
      await tester.tap(comunicados, warnIfMissed: false);
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

      expect(find.byType(LoginPage), findsOneWidget);
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
      expect(find.byType(LoginPage), findsOneWidget);
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