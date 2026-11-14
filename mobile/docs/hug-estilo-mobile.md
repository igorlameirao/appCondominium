# Hug – Estilo-Mobile

Padrão visual e de experiência do aplicativo Flutter **AppCondominium** (`mobile/`), consolidado a partir da **Home minimalista** e do **Login** atualmente aprovados.

Objetivo: guiar novas telas com a mesma identidade azul/ciano/navy, responsividade progressiva e navegação leve — **sem redesenhar** as referências existentes.

> Regra permanente do Cursor (aplicação automática em `mobile/**/*.dart`):  
> `.cursor/rules/hug-estilo-mobile.mdc`

---

## 1. Referências aprovadas

| Tela | Arquivo principal | Papel |
|------|-------------------|--------|
| Home minimalista | `lib/features/home/presentation/home_page.dart` | Shell pós-login, listagens leves, atalhos, drawer, bottom nav |
| Login | `lib/features/auth/presentation/login_page.dart` | Auth visual, teclado, card central, tema claro/escuro |
| Splash | `lib/features/splash/presentation/splash_page.dart` | Entrada (transição) |

---

## 2. Arquitetura de estilos

```
lib/app/theme/          → tokens globais (cores, spacing, M3, tipografia)
lib/shared/widgets/     → UI reutilizável entre features (auth, loading, marca)
lib/features/<feature>/presentation/theme/  → tokens locais quando a feature é referência (ex.: HomeLayout, HomeSurface)
lib/features/<feature>/presentation/widgets/ → composição específica (ex.: home_*)
```

**Ordem de preferência ao estilizar:**

1. `Theme.of(context)` / `AppTheme`
2. `AppColors` + `AppSpacing`
3. Helpers de feature (`HomeSurface`, `HomeLayout`) ou extrair para `shared/` quando uma segunda tela precisar do mesmo contrato
4. Evitar literais (`Color(0xFF...)`, `EdgeInsets.all(13)`) nas páginas

---

## 3. Paleta e identidade

Fonte: `lib/app/theme/app_colors.dart`

| Token | Uso |
|-------|-----|
| `bluePrimary`, `cyanBright`, `cyanSoft` | Ações, ícones ativos, destaques |
| `navyDeep`, `navyCard` | Fundo e superfícies escuras |
| `homeScaffoldLight` (`#F4F9FC`) | Fundo claro da Home (e base ondas) |
| `textNavy`, `textMutedLight` / `textMutedDark` | Hierarquia de texto |
| `neutral100` | Bordas e divisórias suaves (tema claro) |
| `statusSuccess`, `statusDanger` (+ superfícies) | Situação (quando aplicável) |

**Tema Material 3:** `AppTheme.light` / `AppTheme.dark` em `app_theme.dart`.  
`scaffoldBackgroundColor`: claro `neutral50`, escuro `navyDeep` — em telas com fundo customizado (Home), alinhar `Scaffold.backgroundColor` ao helper de fundo (`HomeBackground.baseColor`).

**Modos:** claro, escuro e sistema via `ThemeModeController` (`theme_mode_controller.dart`); seletor no drawer (`HomeDrawerAppearanceSelector`).

---

## 4. Tipografia e hierarquia

Fonte: `app_typography.dart` + `ThemeData.textTheme` (Material 3).

| Nível | Padrão atual |
|-------|----------------|
| Títulos de seção Home | `HomeSectionTitle` + peso forte |
| Saudação Home | ~19,5–20,5 sp interpolado (`HomeLayout.greetingTitleFontSize`) |
| Rótulos de atalho | `labelSmall`, w700, ~11 sp (`HomeLayout.shortcutLabel`) |
| Welcome login | `AppTypography.welcomeTitle` / `welcomeSubtitle` |
| Corpo | `bodyMedium`/`bodyLarge` com altura de linha ~1,35–1,4 |

Títulos de app bar em subpáginas: `titleMedium`, w800, cor `HomeSurface.primaryText` (ex.: lista de pendências).

---

## 5. Espaçamento, alinhamento e responsividade

**Escala global:** `AppSpacing` — `xxs` 4 → `xxxl` 40; raios `cardRadius` 22 (auth/legado), `fieldRadius` 12, `buttonRadius` 22.

**Home progressiva:** `HomeLayout` (`home_layout.dart`)

- Faixa de relaxação vertical: viewports ~650–850 dp (`verticalRelaxation`).
- Padding horizontal da página: `pageHorizontalPadding` = `AppSpacing.md` (16).
- Gaps entre blocos major: interpolação 10–16 dp.
- Largura de conteúdo: derivada de `BoxConstraints`, não de modelo de aparelho (constantes `referenceGalaxy*` só para **testes**).
- Referência de teste S25: 393×851, status bar 24.

**Regra:** passar `BoxConstraints` do `LayoutBuilder` para seções filhas; usar `_lerpMetric` para espaços e alturas mínimas (atalhos, quick access, banner).

---

## 6. Superfícies, bordas e sombras

Fonte principal: `HomeSurface` (`home_surface.dart`)

| Decorator | Quando usar |
|-----------|-------------|
| `minimalCardDecoration` | Destaques (banner), cards compactos — raio **14**, sombra leve, borda sutil |
| `sectionListDecoration` | Lista única (pendências) |
| `shortcutIconBoxDecoration` | Ícones de atalho (não card envolvente) |
| `cardDecoration` | Card mais “cheio” (raio 22) — **reservar**; Home minimalista prefere `minimal*` |
| `listDivider` | Separadores internos |

Sombras: `minimalShadow` (blur 8, offset 2) preferida; evitar empilhar sombras fortes.

---

## 7. Fundos e ondas

| Contexto | Componente |
|----------|------------|
| Home | `HomeBackground` — base `homeScaffoldLight` / `navyDeep`; ondas com opacidade 0,30 (topo) e 0,14 (base); camadas ancoradas com `alignment`, sem `height` fixo que gere corte horizontal |
| Login | `AuthBackground` — imagem oficial em `BoxFit.cover` (não alterar sem pedido) |
| Drawer | `HomeSurface.pageBackground` |

Assets: `lib/core/constants/asset_paths.dart`.

---

## 8. Botões e ações

| Tipo | Widget |
|------|--------|
| Primário login | `AuthGradientButton` |
| Secundário / Google | `AuthOutlineButton` |
| Ação textual Home (banner) | texto + ícone seta, sem botão filled pesado |
| Itens navegação | `InkWell` + `Material(transparent)` |
| Protótipo “em breve” | `showComingSoonMessage` |

Bottom navigation: `HomeBottomNavigation` — fundo branco/navy card, borda superior suave, item ativo com fundo accent 12% opacidade.

---

## 9. Formulários (auth)

Reutilizar: `AuthTextField`, `AuthCard`, divisores `AuthOrDivider`.

- Altura densa, ícones prefix 18, raio `fieldRadius`.
- Bordas: `fieldBorderLight` / `fieldBorderDark`; preenchimento semitransparente no claro.
- Login: `resizeToAvoidBottomInset: true`, scroll no teclado, `SafeArea` com ajuste de rodapé via `MediaQuery.viewInsetsOf` / `viewPaddingOf`.

Validação real e mensagens de erro de campo: **lacuna** — ainda não há padrão global além do auth visual.

---

## 10. Listas, cabeçalhos e navegação

- **Home:** `CustomScrollView` + `SliverList`, física `ClampingScrollPhysics`.
- **Pendências (lista completa):** `ListView.separated` + `HomePendingItemTile`.
- **Cabeçalho Home:** `HomeHeader` (menu, marca, condomínio).
- **Drawer:** largura `min(86% tela, 304)`, grupos `HomeDrawerNavGroup`, rodapé `HomeDrawerFooter`.
- **App bar interna:** fundo transparente, elevação 0, ícone/texto via `HomeSurface`.

---

## 11. Feedback de estado

| Estado | Implementação atual |
|--------|---------------------|
| Carregamento | `AppLoadingIndicator` |
| Sucesso / info curta | `SnackBar` (tema M3 flutuante) |
| Funcionalidade futura | `showComingSoonMessage` |
| Erro API | `ApiException`, `AppFailure` (core) — **sem** widget de erro/empty state padrão ainda |
| Ausência de dados | **lacuna** — definir quando houver listas reais |

---

## 12. Acessibilidade e toque

- Áreas de toque: padding em `InkWell`, ícones de navegação ~23 px.
- Contraste: texto primário/secundário via `HomeSurface` no escuro/claro.
- Texto longo: `maxLines` + `ellipsis` em rótulos de grid.
- Drawer e botões acessíveis por tamanho mínimo confortável (não depender só do ícone 24 sem padding).

---

## 13. Duplicações conhecidas (não corrigir sem necessidade)

| Situação | Arquivos |
|----------|----------|
| Cor de fundo claro Home | `HomeBackground.baseColor`, `HomeSurface.pageBackground`, `AuthBackground` (`#F4F9FC`) — equivalentes; unificar só se extraírem `AppSurface` global |
| Card radius 22 vs 14 | `AppSpacing.cardRadius` vs `HomeSurface.minimalRadius` — intencional (auth vs minimalista) |
| `HomeLayout` / `HomeSurface` | Específicos da Home; extrair para `shared/` quando outra feature adoptar o mesmo shell |

---

## 14. Lacunas para novas telas

Resolver quando a feature surgir (sem bloquear o padrão atual):

1. **`AppSurface` global** — equivalente a `HomeSurface` fora da Home (app bar, listas, cards minimalistas).
2. **Empty / error states** — widgets em `shared/` com ilustração leve e CTA.
3. **Validação de formulário** — mensagens, borda de erro, acessibilidade.
4. **Loading temático** — `AppLoadingIndicator` com cores `AppColors` e tamanho consistente.
5. **Padrão de página secundária** — scaffold + fundo + app bar (hoje espelhado manualmente em `HomePendingListPage`).
6. **Testes visuais golden** — opcional para regressão de temas.

---

## 15. Validação contínua

```bash
cd mobile
flutter analyze
flutter test
```

Testes de layout Home: `test/home_page_layout_test.dart`, `test/home_viewport_metrics_test.dart`, `test/home_layout_progressive_test.dart`.

---

## 16. Checklist rápido (nova tela)

- [ ] Consultou `lib/shared/` e tokens em `lib/app/theme/`
- [ ] Claro + escuro verificados
- [ ] `LayoutBuilder` / relaxação vertical se a tela for densa em conteúdo
- [ ] SafeArea e teclado (se houver formulário)
- [ ] Sem duplicar widgets; Home/login intocados
- [ ] Analyze e testes verdes