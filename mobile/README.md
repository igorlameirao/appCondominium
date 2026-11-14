# AppCondominium Mobile (`appcondominium_mobile`)

Aplicativo Flutter corporativo do ecossistema AppCondominium, com arquitetura **feature-first**, **MVVM** (Riverpod) e camada de rede preparada para a **WebApi** ASP.NET Core.

## Identificadores de pacote

| Plataforma | App legado (`AppCondominium/`) | Novo app (`mobile/`) |
|------------|-------------------------------|----------------------|
| Android `applicationId` | `com.appcondominium` | `br.com.appcondominium.mobile` |
| iOS Bundle ID | `com.example.sagazCondominium` | `br.com.appcondominium.mobile` |

O novo identificador permite instalação lado a lado durante a migração e evita o domínio `com.example` no iOS.

## Requisitos

- Flutter 3.41+ (Dart 3.11+)
- Android SDK (build Android)
- Xcode no macOS (build iOS — indisponível neste ambiente Windows)

## Primeira execução

```bash
cd mobile
flutter pub get
flutter run
```

### Variáveis de compilação (`--dart-define`)

| Chave | Padrão | Descrição |
|-------|--------|-----------|
| `APP_ENV` | `development` | `development`, `staging`/`homologacao`, `production`/`prod` |
| `API_BASE_URL` | `http://localhost:5000` | Base da WebApi (HTTPS em produção) |
| `API_LOGGING` | `true` | Log HTTP (desligado automaticamente em produção) |

Exemplo:

```bash
flutter run --dart-define=APP_ENV=staging --dart-define=API_BASE_URL=https://api-hml.exemplo.com
```

## Padrão visual Hug – Estilo-Mobile

Documentação do design system mobile (Home minimalista + Login): [`docs/hug-estilo-mobile.md`](docs/hug-estilo-mobile.md).  
Regra do Cursor: `.cursor/rules/hug-estilo-mobile.mdc` (na raiz do monorepo).

## Estrutura

```
lib/
  app/           # bootstrap, MaterialApp, GoRouter, tema M3
  core/          # config, rede (Dio), erros, secure storage
  shared/        # widgets reutilizáveis
  features/
    auth/
    condominios/
    home/
    perfil/
    splash/
  main.dart
```

## Validação local

```bash
flutter pub get
flutter analyze
flutter test
flutter build apk --debug   # Android
```

## Escopo desta fundação

- Tema claro/escuro provisório (Material 3)
- Navegação inicial (`/` splash → `/home` placeholder)
- `ApiClient` + interceptors (sem chamadas HTTP na inicialização)
- Constantes `ApiPaths` alinhadas a rotas reais (`api/auth`, `api/condominio`, etc.)
- Dependências para auth biométrica, armazenamento seguro e FCM (sem configurar Firebase ainda)

**Não incluído nesta etapa:** login, integração funcional com API, Firebase, telas de negócio.

## Próximos passos sugeridos

1. Definir identidade visual e substituir tema provisório.
2. Implementar fluxo de autenticação (`POST /api/auth/login`) e sessão JWT.
3. Modelar permissões e shell com menus dinâmicos.
4. Configurar Firebase (FCM) em ambiente de homologação.
5. Pipeline de assinatura Android/iOS para lojas.

## Licenças Android

Se `flutter doctor` reportar licenças pendentes, execute `flutter doctor --android-licenses` (interativo).
