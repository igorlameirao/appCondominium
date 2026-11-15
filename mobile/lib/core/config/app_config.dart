import 'environment.dart';

/// Falha de configuração do app (mensagem segura para exibir/logar).
class AppConfigException implements Exception {
  const AppConfigException(this.message);

  final String message;

  @override
  String toString() => message;
}

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

  /// Em produção exige `API_BASE_URL` HTTPS válida e não local.
  static void validateApiBaseUrl({
    required AppEnvironment environment,
    required String apiBaseUrl,
  }) {
    if (environment != AppEnvironment.production) {
      return;
    }

    final trimmed = apiBaseUrl.trim();
    if (trimmed.isEmpty) {
      throw const AppConfigException(
        'Configuração inválida: em produção, API_BASE_URL não pode estar vazia.',
      );
    }

    final uri = Uri.tryParse(trimmed);
    if (uri == null || !uri.hasScheme || !uri.hasAuthority) {
      throw const AppConfigException(
        'Configuração inválida: em produção, API_BASE_URL deve ser uma URL válida.',
      );
    }

    if (uri.scheme.toLowerCase() != 'https') {
      throw const AppConfigException(
        'Configuração inválida: em produção, API_BASE_URL deve usar o protocolo HTTPS.',
      );
    }

    if (_isLocalOrLoopbackHost(uri.host)) {
      throw const AppConfigException(
        'Configuração inválida: em produção, API_BASE_URL não pode apontar para localhost.',
      );
    }
  }

  /// Ajusta a base para o [Dio]: [ApiPaths] já começam com `/api/...`.
  /// Aceita o prefixo público `…/api` sem gerar `/api/api/...` nas requisições.
  static String normalizeApiBaseUrl(String raw) {
    var url = raw.trim();
    while (url.endsWith('/')) {
      url = url.substring(0, url.length - 1);
    }
    if (url.toLowerCase().endsWith('/api')) {
      url = url.substring(0, url.length - 4);
      while (url.endsWith('/')) {
        url = url.substring(0, url.length - 1);
      }
    }
    return url;
  }

  static bool _isLocalOrLoopbackHost(String host) {
    final normalized = host.toLowerCase();
    if (normalized == 'localhost') {
      return true;
    }
    if (normalized == '127.0.0.1' || normalized == '0.0.0.0' || normalized == '::1') {
      return true;
    }
    if (normalized.startsWith('127.')) {
      return true;
    }
    return false;
  }

  factory AppConfig.fromEnvironment() {
    const envName = String.fromEnvironment('APP_ENV', defaultValue: 'development');
    const rawApiBaseUrl = String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'http://localhost:5000',
    );
    const enableApiLogging = bool.fromEnvironment(
      'API_LOGGING',
      defaultValue: true,
    );
    final environment = AppEnvironment.parse(envName);
    validateApiBaseUrl(environment: environment, apiBaseUrl: rawApiBaseUrl);
    final apiBaseUrl = normalizeApiBaseUrl(rawApiBaseUrl);
    return AppConfig(
      environment: environment,
      apiBaseUrl: apiBaseUrl,
      enableApiLogging: environment != AppEnvironment.production && enableApiLogging,
    );
  }
}