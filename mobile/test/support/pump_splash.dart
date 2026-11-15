import 'package:appcondominium_mobile/features/splash/splash_timing.dart';
import 'package:flutter_test/flutter_test.dart';

/// Avança o relógio de teste além do tempo mínimo da splash.
Future<void> pumpPastSplashMinimum(WidgetTester tester) async {
  await tester.pump();
  await tester.pump(kSplashMinimumDisplayDuration);
  await tester.pump();
}