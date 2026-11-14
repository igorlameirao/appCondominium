import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'app_typography.dart';

abstract final class AppTheme {
  static ThemeData get light {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.seed,
      brightness: Brightness.light,
      primary: AppColors.bluePrimary,
      secondary: AppColors.cyanBright,
      surface: AppColors.neutral50,
    );
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AppColors.neutral50,
      snackBarTheme: const SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
      ),
    );
    return base.copyWith(textTheme: AppTypography.textTheme(base.textTheme));
  }

  static ThemeData get dark {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.cyanBright,
      brightness: Brightness.dark,
      primary: AppColors.cyanBright,
      secondary: AppColors.cyanSoft,
      surface: AppColors.navyCard,
    );
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AppColors.navyDeep,
      snackBarTheme: const SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
      ),
    );
    return base.copyWith(textTheme: AppTypography.textTheme(base.textTheme));
  }
}
