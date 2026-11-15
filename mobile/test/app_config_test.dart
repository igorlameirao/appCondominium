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

  test('desenvolvimento aceita API HTTP em localhost', () {
    expect(
      () => AppConfig.validateApiBaseUrl(
        environment: AppEnvironment.development,
        apiBaseUrl: 'http://localhost:5000',
      ),
      returnsNormally,
    );
  });

  test('produção aceita URL HTTPS pública válida', () {
    expect(
      () => AppConfig.validateApiBaseUrl(
        environment: AppEnvironment.production,
        apiBaseUrl: 'https://api.exemplo.com.br',
      ),
      returnsNormally,
    );
  });

  test('produção rejeita HTTP', () {
    expect(
      () => AppConfig.validateApiBaseUrl(
        environment: AppEnvironment.production,
        apiBaseUrl: 'http://api.exemplo.com.br',
      ),
      throwsA(
        isA<AppConfigException>().having(
          (e) => e.message,
          'message',
          contains('HTTPS'),
        ),
      ),
    );
  });

  test('produção rejeita localhost', () {
    expect(
      () => AppConfig.validateApiBaseUrl(
        environment: AppEnvironment.production,
        apiBaseUrl: 'https://localhost:5000',
      ),
      throwsA(isA<AppConfigException>()),
    );
    expect(
      () => AppConfig.validateApiBaseUrl(
        environment: AppEnvironment.production,
        apiBaseUrl: 'https://127.0.0.1',
      ),
      throwsA(isA<AppConfigException>()),
    );
  });

  test('normalizeApiBaseUrl remove sufixo /api para evitar duplicação no Dio', () {
    expect(
      AppConfig.normalizeApiBaseUrl('https://appcondominium.com.br/api'),
      'https://appcondominium.com.br',
    );
    expect(
      AppConfig.normalizeApiBaseUrl('https://appcondominium.com.br/api/'),
      'https://appcondominium.com.br',
    );
    expect(
      AppConfig.normalizeApiBaseUrl('http://localhost:5000'),
      'http://localhost:5000',
    );
    expect(
      AppConfig.normalizeApiBaseUrl('https://api.exemplo.com.br'),
      'https://api.exemplo.com.br',
    );
  });

  test('produção rejeita URL vazia ou malformada', () {
    expect(
      () => AppConfig.validateApiBaseUrl(
        environment: AppEnvironment.production,
        apiBaseUrl: '   ',
      ),
      throwsA(isA<AppConfigException>()),
    );
    expect(
      () => AppConfig.validateApiBaseUrl(
        environment: AppEnvironment.production,
        apiBaseUrl: 'não-é-url',
      ),
      throwsA(isA<AppConfigException>()),
    );
  });
}