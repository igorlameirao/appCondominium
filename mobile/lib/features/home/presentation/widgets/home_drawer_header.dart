import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../domain/models/home_models.dart';
import '../theme/home_surface.dart';

class HomeDrawerHeader extends StatelessWidget {
  const HomeDrawerHeader({
    super.key,
    required this.resident,
    required this.condominium,
  });

  final HomeResidentContext resident;
  final HomeCondominiumSelection condominium;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final accent = HomeSurface.iconAccent(context);
    final headerTint = isDark
        ? AppColors.navyCard.withValues(alpha: 0.65)
        : AppColors.bluePrimary.withValues(alpha: 0.06);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.md,
        AppSpacing.lg,
        AppSpacing.lg,
      ),
      decoration: BoxDecoration(
        color: headerTint,
        border: Border(
          bottom: BorderSide(
            color: isDark
                ? Colors.white.withValues(alpha: 0.08)
                : AppColors.neutral100,
          ),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _DrawerAvatar(resident: resident, accent: accent, isDark: isDark),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  resident.displayName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: HomeSurface.primaryText(context),
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 2),
                Text(
                  resident.roleLabel,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: accent,
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  condominium.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: HomeSurface.secondaryText(context),
                        fontWeight: FontWeight.w500,
                        height: 1.25,
                      ),
                ),
                const SizedBox(height: 2),
                Text(
                  resident.unitLabel,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: HomeSurface.secondaryText(context),
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DrawerAvatar extends StatelessWidget {
  const _DrawerAvatar({
    required this.resident,
    required this.accent,
    required this.isDark,
  });

  final HomeResidentContext resident;
  final Color accent;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      radius: 28,
      backgroundColor:
          isDark ? AppColors.navyCard : AppColors.neutral100,
      foregroundImage: resident.avatarAssetPath != null
          ? AssetImage(resident.avatarAssetPath!)
          : null,
      child: resident.avatarAssetPath == null
          ? Icon(Icons.person_rounded, color: accent, size: 28)
          : null,
    );
  }
}