enum AppEnvironment {
  development,
  staging,
  production;

  static AppEnvironment parse(String raw) {
    return switch (raw.toLowerCase()) {
      'staging' || 'homologacao' || 'hml' => AppEnvironment.staging,
      'production' || 'prod' => AppEnvironment.production,
      _ => AppEnvironment.development,
    };
  }

  String get label => switch (this) {
        AppEnvironment.development => 'Desenvolvimento',
        AppEnvironment.staging => 'Homologação',
        AppEnvironment.production => 'Produção',
      };
}
