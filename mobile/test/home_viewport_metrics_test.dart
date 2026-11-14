import 'package:appcondominium_mobile/features/home/presentation/home_page.dart';
import 'package:appcondominium_mobile/features/home/presentation/theme/home_layout.dart';
import 'package:appcondominium_mobile/features/home/presentation/widgets/home_bottom_navigation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

/// Viewport lógico típico do Galaxy S25 (1080×2340 @ ~2,75 dpr).
const galaxyS25LogicalWidth = HomeLayout.referenceGalaxyWidth;
const galaxyS25LogicalHeight = HomeLayout.referenceGalaxyHeight;
const galaxyS25StatusBarInset = HomeLayout.referenceStatusBarInset;

/// Referência de altura do conteúdo após unificação dos destaques (sem card Comunicados).
const baselineContentHeightBeforeCompaction = 760.0;

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Future<HomeViewportMetrics> pumpHomeGalaxyS25(WidgetTester tester) async {
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    tester.view.physicalSize = Size(
      galaxyS25LogicalWidth,
      galaxyS25LogicalHeight,
    );
    tester.view.devicePixelRatio = 1.0;

    await tester.pumpWidget(
      ProviderScope(
        child: MediaQuery(
          data: const MediaQueryData(
            size: Size(galaxyS25LogicalWidth, galaxyS25LogicalHeight),
            padding: EdgeInsets.only(top: galaxyS25StatusBarInset),
            viewPadding: EdgeInsets.only(top: galaxyS25StatusBarInset),
          ),
          child: MaterialApp(
            theme: ThemeData(brightness: Brightness.light, useMaterial3: true),
            home: const HomePage(),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    final scaffoldContext = tester.element(find.byType(Scaffold));
    final mq = MediaQuery.of(scaffoldContext);

    final bottomNavHeight = tester
        .renderObject<RenderBox>(find.byType(HomeBottomNavigation))
        .size
        .height;

    final scrollAreaHeight =
        tester.renderObject<RenderBox>(find.byType(CustomScrollView)).size.height;

    final sliverPadding = tester.renderObject<RenderSliverPadding>(
      find.byType(SliverPadding),
    );
    final contentHeight = sliverPadding.geometry?.scrollExtent ?? 0;

    final usefulViewport = HomeLayout.usefulScrollViewportHeight(
      screenHeight: galaxyS25LogicalHeight,
      bottomNavigationHeight: bottomNavHeight,
      statusBarInset: mq.padding.top,
    );

    return HomeViewportMetrics(
      contentHeight: contentHeight,
      scrollViewportHeight: scrollAreaHeight,
      usefulViewportHeight: usefulViewport,
      bottomNavHeight: bottomNavHeight,
      statusBarInset: mq.padding.top,
    );
  }

  testWidgets(
    'Galaxy S25: conteúdo cabe ou ultrapassa pouco a área rolável',
    (tester) async {
      final metrics = await pumpHomeGalaxyS25(tester);

      expect(tester.takeException(), isNull);
      expect(metrics.contentHeight, lessThan(baselineContentHeightBeforeCompaction));
      expect(
        metrics.overflowPixels,
        lessThanOrEqualTo(4),
        reason:
            'overflow=${metrics.overflowPixels}, content=${metrics.contentHeight}, '
            'viewport=${metrics.scrollViewportHeight}',
      );
    },
  );
}

class HomeViewportMetrics {
  const HomeViewportMetrics({
    required this.contentHeight,
    required this.scrollViewportHeight,
    required this.usefulViewportHeight,
    required this.bottomNavHeight,
    required this.statusBarInset,
  });

  final double contentHeight;
  final double scrollViewportHeight;
  final double usefulViewportHeight;
  final double bottomNavHeight;
  final double statusBarInset;

  double get overflowPixels => contentHeight - scrollViewportHeight;
}