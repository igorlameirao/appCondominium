import 'package:flutter/material.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../domain/models/home_models.dart';
import '../theme/home_surface.dart';

class HomeDrawerNavItemTile extends StatelessWidget {
  const HomeDrawerNavItemTile({
    super.key,
    required this.item,
    required this.onTap,
  });

  final HomeDrawerNavItem item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final accent = HomeSurface.iconAccent(context);
    final enabled = item.enabled;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: enabled ? onTap : null,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.xs,
          ),
          child: Row(
            children: [
              Icon(
                item.icon,
                size: 22,
                color: enabled
                    ? accent
                    : HomeSurface.secondaryText(context).withValues(alpha: 0.4),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  item.label,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: enabled
                            ? HomeSurface.primaryText(context)
                            : HomeSurface.secondaryText(context)
                                .withValues(alpha: 0.45),
                        fontWeight: FontWeight.w500,
                        height: 1.2,
                      ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}