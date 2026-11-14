import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../core/constants/asset_paths.dart';

class AuthFooter extends StatelessWidget {
  const AuthFooter({super.key, required this.isDark});

  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final textColor =
        isDark ? Colors.white.withValues(alpha: 0.88) : AppColors.neutral700;

    final logo = Image.asset(
      AssetPaths.logo3l7Tecnologia,
      height: 42,
      fit: BoxFit.contain,
      alignment: Alignment.center,
      filterQuality: FilterQuality.high,
      gaplessPlayback: true,
    );

    final logoWidget = isDark
        ? ColorFiltered(
            colorFilter: const ColorFilter.matrix(<double>[
              1.12, 0, 0, 0, 28,
              0, 1.12, 0, 0, 28,
              0, 0, 1.12, 0, 28,
              0, 0, 0, 1, 0,
            ]),
            child: logo,
          )
        : logo;

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        logoWidget,
        const SizedBox(width: AppSpacing.sm),
        Container(
          width: 1,
          height: 34,
          color: textColor.withValues(alpha: 0.32),
        ),
        const SizedBox(width: AppSpacing.sm),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Soluções Inteligentes',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: textColor,
                    fontWeight: FontWeight.w400,
                    height: 1.2,
                    fontSize: 11,
                  ),
            ),
            Text(
              'Resultados Reais',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: textColor,
                    fontWeight: FontWeight.w400,
                    height: 1.2,
                    fontSize: 11,
                  ),
            ),
          ],
        ),
      ],
    );
  }
}
