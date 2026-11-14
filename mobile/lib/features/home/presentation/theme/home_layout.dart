import 'dart:ui' show lerpDouble;

import 'package:flutter/material.dart';

import '../../../../app/theme/app_spacing.dart';
import 'home_surface.dart';

/// Métricas responsivas da Home — derivadas das constraints, sem largura fixa de aparelho.
abstract final class HomeLayout {
  static const double pageHorizontalPadding = AppSpacing.md;

  /// Referência para testes (Galaxy S25 @ ~2,75 dpr: 1080×2340).
  static const double referenceGalaxyWidth = 393;
  static const double referenceGalaxyHeight = 851;
  static const double referenceStatusBarInset = 24;

  /// Faixa de altura útil para interpolação progressiva (não binária).
  static const double viewportHeightCompact = 650;
  static const double viewportHeightRelaxed = 850;

  static const double bannerHeightFactor = 0.30;
  static const double bannerHeightFactorRelaxed = 0.32;
  static const double bannerHeightMin = 100;
  static const double bannerHeightMax = 112;
  static const double bannerHeightMinRelaxed = 104;
  static const double bannerHeightMaxRelaxed = 116;

  static const int pendingPreviewLimit = 2;

  static const double mainShortcutRowGap = 6;
  static const double mainShortcutMinHeight = 74;
  static const double mainShortcutMinHeightRelaxed = 78;
  static const double quickAccessMinHeight = 72;
  static const double quickAccessMinHeightRelaxed = 76;
  static const double shortcutIconSize = 26;
  static const double quickAccessIconSize = 25;

  /// 0 = viewport baixo (espaçamentos mínimos); 1 = viewport alto (espaçamentos confortáveis).
  static double verticalRelaxation(BoxConstraints viewport) {
    final h = viewport.maxHeight;
    if (!h.isFinite || h <= 0) return 1;
    final t = (h - viewportHeightCompact) /
        (viewportHeightRelaxed - viewportHeightCompact);
    return t.clamp(0.0, 1.0);
  }

  static double _lerpMetric(
    BoxConstraints viewport,
    double compact,
    double relaxed,
  ) {
    final t = verticalRelaxation(viewport);
    return lerpDouble(compact, relaxed, t)!;
  }

  /// Altura útil ao conteúdo: tela − barra inferior − inset superior (SafeArea).
  static double usefulScrollViewportHeight({
    required double screenHeight,
    required double bottomNavigationHeight,
    required double statusBarInset,
  }) {
    return screenHeight - bottomNavigationHeight - statusBarInset;
  }

  static double pageTopPadding(BoxConstraints viewport) =>
      _lerpMetric(viewport, 6, AppSpacing.xs);

  static double gapAfterHeader(BoxConstraints viewport) =>
      _lerpMetric(viewport, AppSpacing.xxs, AppSpacing.xs);

  static double gapAfterGreeting(BoxConstraints viewport) =>
      _lerpMetric(viewport, AppSpacing.xs, AppSpacing.sm);

  static double gapAfterBanner(BoxConstraints viewport) =>
      _lerpMetric(viewport, AppSpacing.xs, AppSpacing.sm);

  static double gapBetweenMajorSections(BoxConstraints viewport) =>
      _lerpMetric(viewport, 10, AppSpacing.md.toDouble());

  static double pageBottomPadding(BoxConstraints viewport) =>
      _lerpMetric(viewport, AppSpacing.sm, AppSpacing.md.toDouble());

  static double quickAccessTitleGap(BoxConstraints viewport) =>
      _lerpMetric(viewport, AppSpacing.xs, AppSpacing.sm);

  static double pendingItemsGap(BoxConstraints viewport) =>
      _lerpMetric(viewport, AppSpacing.xxs, AppSpacing.xs);

  static double mainShortcutMinHeightFor(BoxConstraints viewport) =>
      _lerpMetric(viewport, mainShortcutMinHeight, mainShortcutMinHeightRelaxed);

  static double quickAccessMinHeightFor(BoxConstraints viewport) =>
      _lerpMetric(viewport, quickAccessMinHeight, quickAccessMinHeightRelaxed);

  static double contentWidth(BoxConstraints viewport) {
    final width = viewport.maxWidth - (pageHorizontalPadding * 2);
    return width.clamp(0, viewport.maxWidth);
  }

  static double bannerHeight(BoxConstraints viewport) {
    final width = viewport.maxWidth;
    final t = verticalRelaxation(viewport);
    final factor = lerpDouble(bannerHeightFactor, bannerHeightFactorRelaxed, t)!;
    final min = lerpDouble(bannerHeightMin, bannerHeightMinRelaxed, t)!;
    final max = lerpDouble(bannerHeightMax, bannerHeightMaxRelaxed, t)!;
    return (width * factor).clamp(min, max);
  }

  static double bannerImageWidth(BoxConstraints viewport) {
    final width = contentWidth(viewport);
    return (width * 0.27).clamp(76.0, 98.0);
  }

  static double bannerCardVerticalPadding(BoxConstraints viewport) =>
      _lerpMetric(viewport, AppSpacing.xs, AppSpacing.xs + 2);

  static double bannerDotsGap(BoxConstraints viewport) =>
      _lerpMetric(viewport, AppSpacing.xxs, AppSpacing.xs);

  static double greetingTitleFontSize(BoxConstraints viewport) =>
      _lerpMetric(viewport, 19.5, 20.5);

  static double greetingSubtitleGap(BoxConstraints viewport) =>
      _lerpMetric(viewport, 3, 6);

  static double shortcutCardVerticalPadding(BoxConstraints viewport) =>
      _lerpMetric(viewport, AppSpacing.xs, AppSpacing.xs + 2);

  static double quickAccessCardVerticalPadding(BoxConstraints viewport) =>
      _lerpMetric(viewport, AppSpacing.xs + 2, AppSpacing.sm);

  static double pendingTileVerticalPadding(BoxConstraints viewport) =>
      _lerpMetric(viewport, AppSpacing.xs, AppSpacing.xs + 2);

  /// Rótulo exibido (ex.: id `correspondencias` permanece nos modelos).
  static String shortcutDisplayLabel(String label) {
    if (label == 'Correspondências') return 'Encomendas';
    return label;
  }

  static double shortcutLabelFontSize(String label) => 11;

  static Widget shortcutLabel(BuildContext context, String label) {
    final display = shortcutDisplayLabel(label);
    return Text(
      display,
      textAlign: TextAlign.center,
      maxLines: 2,
      overflow: TextOverflow.ellipsis,
      softWrap: true,
      style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: HomeSurface.primaryText(context),
            fontWeight: FontWeight.w700,
            fontSize: shortcutLabelFontSize(label),
            height: 1.1,
          ),
    );
  }
}