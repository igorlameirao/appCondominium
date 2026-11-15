import 'package:appcondominium_mobile/features/splash/splash_timing.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('splashRemainingMinimumDelay', () {
    final startedAt = DateTime(2020, 1, 1, 12, 0, 0);
    const minimum = Duration(seconds: 2);

    test('retorna o restante quando ainda não passou o mínimo', () {
      expect(
        splashRemainingMinimumDelay(
          startedAt: startedAt,
          minimum: minimum,
          now: startedAt.add(const Duration(milliseconds: 500)),
        ),
        const Duration(milliseconds: 1500),
      );
    });

    test('retorna zero quando o mínimo já foi atingido', () {
      expect(
        splashRemainingMinimumDelay(
          startedAt: startedAt,
          minimum: minimum,
          now: startedAt.add(const Duration(seconds: 3)),
        ),
        Duration.zero,
      );
    });
  });

  group('isSplashReadyToNavigate', () {
    final startedAt = DateTime(2020, 1, 1, 12, 0, 0);
    const minimum = Duration(seconds: 2);

    test('falso enquanto a inicialização não terminou', () {
      expect(
        isSplashReadyToNavigate(
          initializationComplete: false,
          startedAt: startedAt,
          minimum: minimum,
          now: startedAt.add(const Duration(seconds: 5)),
        ),
        isFalse,
      );
    });

    test('falso quando inicialização terminou antes do mínimo', () {
      expect(
        isSplashReadyToNavigate(
          initializationComplete: true,
          startedAt: startedAt,
          minimum: minimum,
          now: startedAt.add(const Duration(seconds: 1)),
        ),
        isFalse,
      );
    });

    test('verdadeiro quando inicialização e mínimo estão completos', () {
      expect(
        isSplashReadyToNavigate(
          initializationComplete: true,
          startedAt: startedAt,
          minimum: minimum,
          now: startedAt.add(const Duration(seconds: 2)),
        ),
        isTrue,
      );
    });
  });
}