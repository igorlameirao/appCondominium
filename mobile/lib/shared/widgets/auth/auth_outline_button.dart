import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';

class AuthOutlineButton extends StatelessWidget {
  const AuthOutlineButton({
    super.key,
    required this.label,
    required this.onPressed,
    required this.isDark,
    this.icon,
    this.iconAsset,
  });

  final String label;
  final VoidCallback onPressed;
  final bool isDark;
  final IconData? icon;
  final String? iconAsset;

  @override
  Widget build(BuildContext context) {
    final borderColor =
        isDark ? AppColors.cyanBright.withValues(alpha: 0.65) : AppColors.cyanBright;
    final textColor = isDark ? Colors.white : AppColors.textNavy;
    final fill = isDark
        ? Colors.white.withValues(alpha: 0.04)
        : Colors.white.withValues(alpha: 0.7);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(AppSpacing.buttonRadius),
        child: Ink(
          decoration: BoxDecoration(
            color: fill,
            borderRadius: BorderRadius.circular(AppSpacing.buttonRadius),
            border: Border.all(color: borderColor, width: 1.4),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(
              vertical: AppSpacing.sm + 1,
              horizontal: AppSpacing.md,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (iconAsset != null) ...[
                  Image.asset(
                    iconAsset!,
                    width: 24,
                    height: 24,
                    fit: BoxFit.contain,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                ] else if (icon != null) ...[
                  Icon(icon, color: isDark ? AppColors.cyanSoft : AppColors.bluePrimary),
                  const SizedBox(width: AppSpacing.sm),
                ],
                Text(
                  label,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: textColor,
                        fontWeight: FontWeight.w500,
                        fontSize: 13,
                      ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
