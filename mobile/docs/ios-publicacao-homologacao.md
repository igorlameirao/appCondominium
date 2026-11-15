# iOS — homologação e Universal Links (Fase 7.2)

Documentação de apoio à publicação na Apple App Store e TestFlight. **Não** substitui o deploy do `apple-app-site-association` no servidor nem a configuração de certificados no Apple Developer.

## Identidade do app

| Campo | Valor atual |
|-------|-------------|
| Bundle Identifier (`PRODUCT_BUNDLE_IDENTIFIER`) | `br.com.appcondominium.mobile` |
| Nome exibido (`CFBundleDisplayName`) | AppCondominium |
| `CFBundleShortVersionString` / `CFBundleVersion` | `1.0.0` / `1` (`pubspec.yaml` → `FLUTTER_BUILD_NAME` / `FLUTTER_BUILD_NUMBER`) |
| Deployment Target (`IPHONEOS_DEPLOYMENT_TARGET`) | 13.0 |

O app legado em `AppCondominium/` usa `com.example.sagazCondominium`; o novo app mantém identificador distinto (ver `mobile/README.md`).

## Universal Links configurados

Domínio: `appcondominium.com.br` (entitlement `applinks:appcondominium.com.br` em `ios/Runner/Runner.entitlements`).

| Caminho | Rota Flutter (`go_router`) |
|---------|----------------------------|
| `/convite/aceitar` | `AppRoute.conviteAceitar` |
| `/recuperacao-senha/redefinir` | `AppRoute.recuperacaoSenhaRedefinir` |

Query `token` é repassada pelo `go_router` (`state.uri.queryParameters['token']`).

O app declara `FlutterDeepLinkingEnabled` em `Info.plist` para o engine encaminhar URLs HTTPS ao `GoRouter`.

## Apple App Site Association (AASA)

Publicar **sem extensão** em pelo menos um destes URLs (HTTPS, `Content-Type: application/json`):

- `https://appcondominium.com.br/.well-known/apple-app-site-association`
- `https://appcondominium.com.br/apple-app-site-association`

Modelo sem Team ID real: [`ios-universal-links-apple-app-site-association.template.json`](./ios-universal-links-apple-app-site-association.template.json).

Substitua `SUBSTITUIR_PELO_APPLE_TEAM_ID` pelo **Team ID** da conta Apple Developer (10 caracteres, visível em *Membership* no portal). Formato do `appID` / entrada em `appIDs`: `{TeamID}.br.com.appcondominium.mobile`.

Validação: [Apple App Search Validation Tool](https://search.developer.apple.com/appsearch-validation-tool/) ou abrir o link no Safari em dispositivo físico após instalar o build.

## Build de release e API

```bash
flutter build ipa --dart-define=APP_ENV=production --dart-define=API_BASE_URL=https://SUA_API_PRODUCAO
```

- `API_LOGGING` é desativado automaticamente quando `APP_ENV` é `production`/`prod` (`lib/core/config/app_config.dart`).
- Em produção, use **HTTPS** na API (App Transport Security padrão do iOS bloqueia HTTP cleartext).

## Segurança (revisão estática)

| Item | Situação |
|------|----------|
| JWT / sessão | `flutter_secure_storage` (Keychain no iOS) — `lib/core/security/token_storage.dart` |
| Credenciais fixas no código | Não identificadas; API via `--dart-define` |
| ATS (HTTPS) | Padrão do sistema; sem exceções em `Info.plist` |
| `NSFaceIDUsageDescription` | Declarado para uso futuro de `local_auth` |
| Push (FCM) | Dependências no `pubspec.yaml`; **sem** `GoogleService-Info.plist` nem entitlement `aps-environment` ainda |

## Pendências manuais (macOS + Apple Developer)

1. Conta **Apple Developer Program** ativa e App ID `br.com.appcondominium.mobile` com capability **Associated Domains**.
2. **Team ID** no Xcode (`Signing & Capabilities`); provisioning profile de distribuição (App Store / Ad Hoc para TestFlight).
3. Publicar AASA no domínio com Team ID correto.
4. **Ícones**: `AppIcon.appiconset` inclui 1024×1024; revisar arte final da marca antes do envio.
5. **Splash**: `LaunchScreen.storyboard` (padrão Flutter); alinhar visual à marca se necessário.
6. **Política de privacidade**: URL obrigatória no App Store Connect.
7. **Firebase**: adicionar `GoogleService-Info.plist`, capability Push e APNs quando FCM for habilitado.
8. TestFlight: primeiro upload via Xcode Organizer ou `flutter build ipa` + Transporter; metadados e revisão de privacidade no App Store Connect.

**Não** gerar certificados, alterar `DEVELOPMENT_TEAM` no repositório nem publicar builds nesta fase de preparação.