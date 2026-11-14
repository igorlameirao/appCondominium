import 'package:flutter/material.dart';

import 'app_colors.dart';

abstract final class AppTypography {
  static TextTheme textTheme(TextTheme base) {
    return base.copyWith(
      headlineSmall: base.headlineSmall?.copyWith(
        fontWeight: FontWeight.w700,
        letterSpacing: -0.2,
      ),
      titleLarge: base.titleLarge?.copyWith(
        fontWeight: FontWeight.w700,
        fontSize: 22,
      ),
      titleMedium: base.titleMedium?.copyWith(
        fontWeight: FontWeight.w600,
      ),
      bodyLarge: base.bodyLarge?.copyWith(height: 1.4),
      bodyMedium: base.bodyMedium?.copyWith(height: 1.35),
      labelLarge: base.labelLarge?.copyWith(fontWeight: FontWeight.w600),
    );
  }

  static TextStyle welcomeTitle(BuildContext context, {required bool isDark}) {
    return Theme.of(context).textTheme.titleMedium!.copyWith(
          color: isDark ? Colors.white : AppColors.textNavy,
          fontWeight: FontWeight.w700,
          fontSize: 18,
        );
  }

  static TextStyle welcomeSubtitle(BuildContext context, {required bool isDark}) {
    return Theme.of(context).textTheme.bodySmall!.copyWith(
          color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
          fontSize: 12,
          fontWeight: FontWeight.w400,
          height: 1.3,
        );
  }
}
