import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../shared/widgets/auth/coming_soon_message.dart';
import '../../domain/models/home_models.dart';
import '../theme/home_layout.dart';
import '../theme/home_surface.dart';

class HomeMainShortcuts extends StatelessWidget {
  const HomeMainShortcuts({
    super.key,
    required this.items,
    required this.viewport,
  });

  final List<HomeShortcutItem> items;
  final BoxConstraints viewport;

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (var i = 0; i < items.length; i++) ...[
            if (i > 0) const SizedBox(width: HomeLayout.mainShortcutRowGap),
            Expanded(
              child: _ShortcutTile(item: items[i], viewport: viewport),
            ),
          ],
        ],
      ),
    );
  }
}

class _ShortcutTile extends StatelessWidget {
  const _ShortcutTile({required this.item, required this.viewport});

  final HomeShortcutItem item;
  final BoxConstraints viewport;

  @override
  Widget build(BuildContext context) {
    final accent = HomeSurface.iconAccent(context);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => showComingSoonMessage(context),
        borderRadius: BorderRadius.circular(12),
        child: ConstrainedBox(
          constraints: BoxConstraints(
            minHeight: HomeLayout.mainShortcutMinHeightFor(viewport),
          ),
          child: Padding(
            padding: EdgeInsets.symmetric(
              vertical: HomeLayout.shortcutCardVerticalPadding(viewport),
              horizontal: 2,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.max,
              children: [
                SizedBox(
                  width: 44,
                  height: 44,
                  child: Stack(
                    clipBehavior: Clip.none,
                    alignment: Alignment.center,
                    children: [
                      DecoratedBox(
                        decoration: HomeSurface.shortcutIconBoxDecoration(
                          context,
                        ),
                        child: SizedBox(
                          width: 44,
                          height: 44,
                          child: Icon(
                            item.icon,
                            color: accent,
                            size: HomeLayout.shortcutIconSize,
                          ),
                        ),
                      ),
                      if (item.badgeCount != null && item.badgeCount! > 0)
                        Positioned(
                          top: -2,
                          right: -2,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 5,
                              vertical: 1,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.statusDanger,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              '${item.badgeCount}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 6),
                HomeLayout.shortcutLabel(context, item.label),
              ],
            ),
          ),
        ),
      ),
    );
  }
}