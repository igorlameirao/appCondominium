import 'package:flutter/material.dart';

import '../../app/theme/app_colors.dart';
import '../../core/constants/asset_paths.dart';

/// Marca central (símbolo + wordmark), alinhada à splash nativa e ao login.
class AppBrandMark extends StatelessWidget {
  const AppBrandMark({
    super.key,
    this.maxSymbolHeight = 220,
    this.minSymbolHeight = 136,
    this.lightBackground = true,
  });

  final double maxSymbolHeight;
  final double minSymbolHeight;
  final bool lightBackground;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final maxWidth = constraints.maxWidth.isFinite
            ? constraints.maxWidth
            : MediaQuery.sizeOf(context).width;
        final symbolHeight =
            (maxWidth * 0.42).clamp(minSymbolHeight, maxSymbolHeight);
        final wordmarkSize = (maxWidth * 0.052).clamp(18.0, 24.0);
        final gap = (maxWidth * 0.035).clamp(28.0, 40.0);

        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.asset(
              AssetPaths.logoAppCondominiumIcon,
              height: symbolHeight,
              fit: BoxFit.contain,
              filterQuality: FilterQuality.high,
            ),
            SizedBox(height: gap),
            _AppCondominiumWordmark(
              fontSize: wordmarkSize,
              lightBackground: lightBackground,
            ),
          ],
        );
      },
    );
  }
}

class _AppCondominiumWordmark extends StatelessWidget {
  const _AppCondominiumWordmark({
    required this.fontSize,
    required this.lightBackground,
  });

  final double fontSize;
  final bool lightBackground;

  @override
  Widget build(BuildContext context) {
    final wordmarkStyle = TextStyle(
      fontSize: fontSize,
      fontWeight: FontWeight.w600,
      letterSpacing: -0.25,
      height: 1.05,
    );

    return Text.rich(
      TextSpan(
        children: [
          TextSpan(
            text: 'App',
            style: wordmarkStyle.copyWith(color: AppColors.brandAppCyan),
          ),
          TextSpan(
            text: 'Condominium',
            style: wordmarkStyle.copyWith(
              color: lightBackground ? AppColors.textNavy : Colors.white,
            ),
          ),
        ],
      ),
      textAlign: TextAlign.center,
    );
  }
}