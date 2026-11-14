import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/config/app_config.dart';

/// Configuração carregada na inicialização (sem I/O de rede ou serviços externos).
AppConfig loadAppConfig() => AppConfig.fromEnvironment();

final appConfigProvider = Provider<AppConfig>(
  (ref) => throw UnimplementedError('appConfigProvider deve ser sobrescrito em main'),
);
