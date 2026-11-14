import 'package:appcondominium_mobile/core/config/app_config.dart';
import 'package:appcondominium_mobile/core/config/environment.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('AppConfig.fromEnvironment usa valores padrão de desenvolvimento', () {
    final config = AppConfig.fromEnvironment();
    expect(config.environment, AppEnvironment.development);
    expect(config.apiBaseUrl, isNotEmpty);
    expect(config.enableApiLogging, isTrue);
  });
}
