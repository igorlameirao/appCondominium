import 'environment.dart';

class AppConfig {
  const AppConfig({
    required this.environment,
    required this.apiBaseUrl,
    required this.enableApiLogging,
  });

  final AppEnvironment environment;
  final String apiBaseUrl;
  final bool enableApiLogging;

  bool get isProduction => environment == AppEnvironment.production;

  factory AppConfig.fromEnvironment() {
    const envName = String.fromEnvironment('APP_ENV', defaultValue: 'development');
    const apiBaseUrl = String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'http://localhost:5000',
    );
    const enableApiLogging = bool.fromEnvironment(
      'API_LOGGING',
      defaultValue: true,
    );
    final environment = AppEnvironment.parse(envName);
    return AppConfig(
      environment: environment,
      apiBaseUrl: apiBaseUrl,
      enableApiLogging: environment != AppEnvironment.production && enableApiLogging,
    );
  }
}
