import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../theme/home_surface.dart';

class HomeDrawerFooter extends StatelessWidget {
  const HomeDrawerFooter({
    super.key,
    required this.onSignOut,
  });

  final VoidCallback onSignOut;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final dividerColor = isDark
        ? Colors.white.withValues(alpha: 0.12)
        : AppColors.neutral100;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Divider(height: 1, color: dividerColor),
        ListTile(
          leading: const Icon(
            Icons.logout_rounded,
            color: AppColors.statusDanger,
          ),
          title: Text(
            'Sair da conta',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: HomeSurface.primaryText(context),
                  fontWeight: FontWeight.w600,
                ),
          ),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.xs,
          ),
          onTap: onSignOut,
        ),
        const SizedBox(height: AppSpacing.xs),
      ],
    );
  }
}