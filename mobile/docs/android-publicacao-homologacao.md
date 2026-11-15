# Android — homologação e App Links (Fase 7.1)

Documentação de apoio à publicação na Google Play. **Não** substitui o deploy do `assetlinks.json` no servidor.

## Identidade do app

| Campo | Valor atual |
|-------|-------------|
| `applicationId` | `br.com.appcondominium.mobile` |
| `namespace` | `br.com.appcondominium.mobile` |
| Nome exibido (`android:label`) | AppCondominium |
| `versionName` / `versionCode` | `1.0.0` / `1` (`pubspec.yaml`) |

O app legado em `AppCondominium/` usa `com.appcondominium`; o novo app mantém identificador distinto para convivência na migração (ver `mobile/README.md`).

## App Links configurados

Domínio: `appcondominium.com.br`

| Caminho | Rota Flutter (`go_router`) |
|---------|----------------------------|
| `/convite/aceitar` | `AppRoute.conviteAceitar` |
| `/recuperacao-senha/redefinir` | `AppRoute.recuperacaoSenhaRedefinir` |

Query `token` é lida nas telas de convite e redefinição de senha.

## Digital Asset Links

Publicar em:

`https://appcondominium.com.br/.well-known/assetlinks.json`

Modelo sem fingerprints reais: [`android-app-links-assetlinks.template.json`](./android-app-links-assetlinks.template.json).

### Como obter o SHA-256 do certificado

**Keystore de upload / release local** (após criar o keystore de produção):

```bash
keytool -list -v -keystore CAMINHO_DO_KEYSTORE -alias ALIAS
```

Use a linha `SHA256:` (formato com dois-pontos, como exigido no JSON).

**Gradle** (inclui variantes debug/release do projeto):

```bash
cd mobile/android
./gradlew :app:signingReport
```

**Google Play App Signing:** na Play Console, em *Configuração do app → Integridade do app*, use o **certificado da chave de assinatura do app** (e, se necessário para testes internos, o da chave de upload). O fingerprint de debug **não** vale para verificação de App Links em produção.

**Debug** (somente para testar `autoVerify` em build de desenvolvimento):

```bash
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

Validação oficial: [Statement List Generator and Tester](https://developers.google.com/digital-asset-links/tools/generator).

## Build de release e API

- Assinatura: `release` ainda usa `signingConfigs.debug` — configurar keystore de upload antes do envio à Play Store.
- API: em produção, compilar com HTTPS, por exemplo:

  ```bash
  flutter build appbundle --dart-define=APP_ENV=production --dart-define=API_BASE_URL=https://SUA_API_PRODUCAO
  ```

- `API_LOGGING` é desativado automaticamente quando `APP_ENV` é `production`/`prod` (`lib/core/config/app_config.dart`).

## Pendências manuais

1. Definir URL final da API de produção (`API_BASE_URL`).
2. Criar keystore de upload e configurar `signingConfigs` em `android/app/build.gradle.kts`.
3. Publicar `assetlinks.json` no domínio com SHA-256 correto(s).
4. Play Console: política de privacidade, classificação de conteúdo, track de teste interno.
5. (Futuro) Firebase/FCM quando habilitado.