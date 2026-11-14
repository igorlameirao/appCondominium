import 'package:appcondominium_mobile/app/router.dart';
import 'package:appcondominium_mobile/features/home/presentation/home_page.dart';
import 'package:appcondominium_mobile/features/home/presentation/home_pending_list_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Ver todas abre listagem completa de pendências', (tester) async {
    final router = GoRouter(
      initialLocation: AppRoute.home.path,
      routes: [
        GoRoute(
          path: AppRoute.home.path,
          builder: (context, state) => const HomePage(),
          routes: [
            GoRoute(
              path: 'pendencias',
              builder: (context, state) => const HomePendingListPage(),
            ),
          ],
        ),
      ],
    );
    addTearDown(router.dispose);

    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.textContaining('Ver todas'));
    await tester.pumpAndSettle();

    expect(find.text('Autorização de visita'), findsOneWidget);
    expect(find.text('Taxa de Condomínio'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
