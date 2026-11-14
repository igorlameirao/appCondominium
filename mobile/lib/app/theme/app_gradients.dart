import 'package:flutter/material.dart';

import 'app_colors.dart';

abstract final class AppGradients {
  static const primaryButton = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [
      AppColors.cyanBright,
      AppColors.bluePrimary,
    ],
  );

  static const darkBackground = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [
      AppColors.navyDeep,
      Color(0xFF0E2240),
      Color(0xFF162A48),
    ],
    stops: [0.0, 0.45, 1.0],
  );

  static const lightBackgroundWash = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [
      Color(0xFFF8FCFF),
      Color(0xFFEEF6FC),
    ],
  );
}
