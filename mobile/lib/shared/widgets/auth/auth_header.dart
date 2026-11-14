import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../core/constants/asset_paths.dart';

/// Ícone oficial + wordmark tipográfica (provisória) + tagline com linhas.
class AuthHeader extends StatelessWidget {
  const AuthHeader({super.key, required this.isDark});

  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final taglineColor =
        isDark ? Colors.white.withValues(alpha: 0.72) : AppColors.textMutedLight;
    final iconHeight = isDark ? 56.0 : 58.0;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Image.asset(
          AssetPaths.logoAppCondominiumIcon,
          height: iconHeight,
          fit: BoxFit.contain,
          filterQuality: FilterQuality.high,
        ),
        const SizedBox(height: AppSpacing.xs),
        _AppCondominiumWordmark(isDark: isDark),
        const SizedBox(height: AppSpacing.xs),
        Row(
          children: [
            Expanded(
              child: Container(
                height: 1,
                color: taglineColor.withValues(alpha: isDark ? 0.35 : 0.45),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
              child: Text(
                'Sistema de Gestão de Condomínios',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: isDark ? AppColors.cyanSoft : AppColors.bluePrimary,
                      fontWeight: FontWeight.w400,
                      letterSpacing: 0.1,
                      height: 1.2,
                      fontSize: 11,
                    ),
              ),
            ),
            Expanded(
              child: Container(
                height: 1,
                color: taglineColor.withValues(alpha: isDark ? 0.35 : 0.45),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

/// Wordmark provisória até existir PNG transparente da marca completa.
class _AppCondominiumWordmark extends StatelessWidget {
  const _AppCondominiumWordmark({required this.isDark});

  final bool isDark;

  @override
  Widget build(BuildContext context) {
    const appStyle = TextStyle(
      fontSize: 20,
      fontWeight: FontWeight.w600,
      letterSpacing: -0.25,
      height: 1.05,
      color: AppColors.brandAppCyan,
    );
    final condominiumStyle = TextStyle(
      fontSize: 20,
      fontWeight: FontWeight.w600,
      letterSpacing: -0.25,
      height: 1.05,
      color: isDark ? Colors.white : AppColors.textNavy,
    );

    return Text.rich(
      TextSpan(
        children: [
          const TextSpan(text: 'App', style: appStyle),
          TextSpan(text: 'Condominium', style: condominiumStyle),
        ],
      ),
      textAlign: TextAlign.center,
    );
  }
}
