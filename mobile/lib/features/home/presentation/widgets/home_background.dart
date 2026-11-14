import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/constants/asset_paths.dart';

/// Fundo claro com ondas suaves nos cantos (tema claro) ou atmosfera escura alinhada ao app.
class HomeBackground extends StatelessWidget {
  const HomeBackground({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return ColoredBox(
      color: HomeBackground.baseColor(isDark),
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (isDark)
            Opacity(
              opacity: 0.30,
              child: Image.asset(
                AssetPaths.backgroundDarkCondominium,
                fit: BoxFit.cover,
                alignment: Alignment.topCenter,
                filterQuality: FilterQuality.high,
              ),
            )
          else ...[
            // Camadas em altura completa: evita borda horizontal do recorte com height fixo.
            Positioned(
              top: -28,
              right: -52,
              left: -44,
              bottom: 0,
              child: Opacity(
                opacity: 0.30,
                child: Image.asset(
                  AssetPaths.backgroundLightWaves,
                  fit: BoxFit.cover,
                  alignment: Alignment.topRight,
                  filterQuality: FilterQuality.high,
                ),
              ),
            ),
            Positioned(
              top: 0,
              bottom: -48,
              left: -48,
              right: -28,
              child: Opacity(
                opacity: 0.14,
                child: Image.asset(
                  AssetPaths.backgroundLightWaves,
                  fit: BoxFit.cover,
                  alignment: Alignment.bottomLeft,
                  filterQuality: FilterQuality.high,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  static Color baseColor(bool isDark) =>
      isDark ? AppColors.navyDeep : AppColors.homeScaffoldLight;
}