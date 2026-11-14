import 'package:flutter/material.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../domain/models/home_models.dart';
import '../theme/home_surface.dart';
import 'home_drawer_nav_item.dart';

class HomeDrawerNavGroupSection extends StatelessWidget {
  const HomeDrawerNavGroupSection({
    super.key,
    required this.group,
    required this.onItemSelected,
  });

  final HomeDrawerNavGroup group;
  final ValueChanged<HomeDrawerNavItem> onItemSelected;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg,
              AppSpacing.sm,
              AppSpacing.lg,
              AppSpacing.xxs,
            ),
            child: Text(
              group.title,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: HomeSurface.secondaryText(context),
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.2,
                  ),
            ),
          ),
          ...group.items.map(
            (item) => HomeDrawerNavItemTile(
              item: item,
              onTap: () => onItemSelected(item),
            ),
          ),
        ],
      ),
    );
  }
}