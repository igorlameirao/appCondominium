import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../domain/models/home_models.dart';
import '../theme/home_layout.dart';
import '../theme/home_surface.dart';
import 'home_pending_item_tile.dart';
import 'home_section_title.dart';

class HomePendingSection extends StatelessWidget {
  const HomePendingSection({
    super.key,
    required this.items,
    required this.viewport,
  });

  final List<HomePendingItem> items;
  final BoxConstraints viewport;

  @override
  Widget build(BuildContext context) {
    final preview = items.take(HomeLayout.pendingPreviewLimit).toList();
    final showViewAll = items.length > HomeLayout.pendingPreviewLimit;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        HomeSectionTitle(
          title: 'Minhas Pendências',
          icon: Icons.task_alt_rounded,
          trailing: showViewAll
              ? _ViewAllLink(totalCount: items.length)
              : null,
        ),
        SizedBox(height: HomeLayout.pendingItemsGap(viewport)),
        if (items.isEmpty)
          _PendingEmptyState()
        else
          DecoratedBox(
            decoration: HomeSurface.sectionListDecoration(context),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(HomeSurface.minimalRadius),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  for (var i = 0; i < preview.length; i++) ...[
                    HomePendingItemTile(
                      item: preview[i],
                      compact: true,
                      verticalPadding:
                          HomeLayout.pendingTileVerticalPadding(viewport),
                    ),
                    if (i < preview.length - 1)
                      Divider(
                        height: 1,
                        thickness: 1,
                        color: HomeSurface.listDivider(context),
                      ),
                  ],
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _ViewAllLink extends StatelessWidget {
  const _ViewAllLink({required this.totalCount});

  final int totalCount;

  @override
  Widget build(BuildContext context) {
    final accent = HomeSurface.iconAccent(context);

    return TextButton(
      onPressed: () => context.push(AppRoute.homePendencias.path),
      style: TextButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xs),
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        visualDensity: VisualDensity.compact,
      ),
      child: Text(
        'Ver todas ($totalCount)',
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: accent,
              fontWeight: FontWeight.w700,
              fontSize: 12,
            ),
      ),
    );
  }
}

class _PendingEmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: HomeSurface.sectionListDecoration(context),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: AppSpacing.sm + 2,
        ),
        child: Row(
          children: [
            Icon(
              Icons.check_circle_outline_rounded,
              size: 20,
              color: HomeSurface.secondaryText(context),
            ),
            const SizedBox(width: AppSpacing.xs),
            Expanded(
              child: Text(
                'Nenhuma pendência no momento.',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: HomeSurface.secondaryText(context),
                      fontWeight: FontWeight.w500,
                    ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
