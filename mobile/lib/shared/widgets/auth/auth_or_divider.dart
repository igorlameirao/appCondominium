import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';

class AuthOrDivider extends StatelessWidget {
  const AuthOrDivider({super.key, required this.isDark});

  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final line = isDark
        ? Colors.white.withValues(alpha: 0.22)
        : AppColors.fieldBorderLight;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
      child: Row(
        children: [
          Expanded(child: Divider(color: line, height: 1)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
            child: Text(
              'ou',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
                    fontWeight: FontWeight.w500,
                  ),
            ),
          ),
          Expanded(child: Divider(color: line, height: 1)),
        ],
      ),
    );
  }
}
