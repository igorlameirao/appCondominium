import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../shared/widgets/auth/coming_soon_message.dart';
import '../../domain/models/home_models.dart';
import '../theme/home_surface.dart';

class HomePendingItemTile extends StatelessWidget {
  const HomePendingItemTile({
    super.key,
    required this.item,
    this.verticalPadding = AppSpacing.xs,
    this.compact = false,
  });

  final HomePendingItem item;
  final double verticalPadding;

  /// Sem card individual — usado na listagem compacta da Home.
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final content = Padding(
      padding: EdgeInsets.symmetric(
        horizontal: AppSpacing.sm + 2,
        vertical: verticalPadding,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: isDark
                  ? AppColors.blueDeep.withValues(alpha: 0.55)
                  : AppColors.neutral100.withValues(alpha: 0.65),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              item.icon,
              color: HomeSurface.iconAccent(context),
              size: 22,
            ),
          ),
          const SizedBox(width: AppSpacing.xs),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  item.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: HomeSurface.primaryText(context),
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                        height: 1.2,
                      ),
                ),
                Text(
                  item.subtitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: HomeSurface.secondaryText(context),
                        fontSize: 12,
                        height: 1.2,
                      ),
                ),
              ],
            ),
          ),
          _StatusChip(status: item.status),
          const SizedBox(width: 4),
          Icon(
            Icons.chevron_right_rounded,
            color: HomeSurface.secondaryText(context),
          ),
        ],
      ),
    );

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => showComingSoonMessage(context),
        borderRadius: compact
            ? BorderRadius.zero
            : BorderRadius.circular(HomeSurface.minimalRadius),
        child: compact
            ? content
            : Ink(
                decoration: HomeSurface.minimalCardDecoration(context),
                child: content,
              ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final HomePendingStatus status;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final (background, foreground) = switch (status.kind) {
      HomePendingStatusKind.danger => (
          isDark
              ? AppColors.statusDanger.withValues(alpha: 0.22)
              : AppColors.statusDangerSurface,
          AppColors.statusDanger,
        ),
      HomePendingStatusKind.success => (
          isDark
              ? AppColors.statusSuccess.withValues(alpha: 0.22)
              : AppColors.statusSuccessSurface,
          AppColors.statusSuccess,
        ),
      HomePendingStatusKind.neutral => (
          isDark
              ? Colors.white.withValues(alpha: 0.08)
              : AppColors.neutral100,
          HomeSurface.secondaryText(context),
        ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.label,
        style: TextStyle(
          color: foreground,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}