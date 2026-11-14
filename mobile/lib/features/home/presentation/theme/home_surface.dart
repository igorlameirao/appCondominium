import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';

abstract final class HomeSurface {
  static Color pageBackground(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return isDark ? AppColors.navyDeep : AppColors.homeScaffoldLight;
  }

  static Color cardBackground(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return isDark ? AppColors.cardDark.withValues(alpha: 0.92) : Colors.white;
  }

  static Color primaryText(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return isDark ? Colors.white : AppColors.textNavy;
  }

  static Color secondaryText(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return isDark ? AppColors.textMutedDark : AppColors.textMutedLight;
  }

  static Color iconAccent(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return isDark ? AppColors.cyanSoft : AppColors.bluePrimary;
  }

  static const double minimalRadius = 14;

  static List<BoxShadow> cardShadow(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return [
      BoxShadow(
        color: isDark
            ? Colors.black.withValues(alpha: 0.35)
            : AppColors.bluePrimary.withValues(alpha: 0.08),
        blurRadius: 16,
        offset: const Offset(0, 6),
      ),
    ];
  }

  static List<BoxShadow> minimalShadow(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return [
      BoxShadow(
        color: isDark
            ? Colors.black.withValues(alpha: 0.2)
            : Colors.black.withValues(alpha: 0.04),
        blurRadius: 8,
        offset: const Offset(0, 2),
      ),
    ];
  }

  static BoxDecoration cardDecoration(BuildContext context) {
    return BoxDecoration(
      color: cardBackground(context),
      borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
      boxShadow: cardShadow(context),
      border: Theme.of(context).brightness == Brightness.dark
          ? Border.all(color: Colors.white.withValues(alpha: 0.06))
          : null,
    );
  }

  /// Card leve para destaques e listagens compactas na Home.
  static BoxDecoration minimalCardDecoration(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return BoxDecoration(
      color: cardBackground(context),
      borderRadius: BorderRadius.circular(minimalRadius),
      boxShadow: minimalShadow(context),
      border: Border.all(
        color: isDark
            ? Colors.white.withValues(alpha: 0.06)
            : AppColors.neutral100.withValues(alpha: 0.85),
      ),
    );
  }

  /// Faixa única da seção de pendências na Home.
  static BoxDecoration sectionListDecoration(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return BoxDecoration(
      color: cardBackground(context),
      borderRadius: BorderRadius.circular(minimalRadius),
      boxShadow: minimalShadow(context),
      border: Border.all(
        color: isDark
            ? Colors.white.withValues(alpha: 0.06)
            : AppColors.neutral100.withValues(alpha: 0.9),
      ),
    );
  }

  /// Quadrado suave atrás dos ícones dos atalhos principais.
  static BoxDecoration shortcutIconBoxDecoration(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return BoxDecoration(
      color: isDark
          ? AppColors.blueDeep.withValues(alpha: 0.45)
          : AppColors.bluePrimary.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(12),
    );
  }

  static Color listDivider(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return isDark
        ? Colors.white.withValues(alpha: 0.08)
        : AppColors.neutral100;
  }
}
