import 'package:flutter/material.dart';

import '../../../../shared/widgets/auth/coming_soon_message.dart';
import '../../domain/models/home_models.dart';
import '../theme/home_layout.dart';
import '../theme/home_surface.dart';
import 'home_section_title.dart';

class HomeQuickAccessSection extends StatelessWidget {
  const HomeQuickAccessSection({
    super.key,
    required this.items,
    required this.viewport,
  });

  final List<HomeQuickAccessItem> items;
  final BoxConstraints viewport;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const HomeSectionTitle(
          title: 'Acesso Rápido',
          icon: Icons.grid_view_rounded,
        ),
        SizedBox(height: HomeLayout.quickAccessTitleGap(viewport)),
        IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              for (var i = 0; i < items.length; i++) ...[
                if (i > 0) const SizedBox(width: HomeLayout.mainShortcutRowGap),
                Expanded(
                  child: _QuickAccessTile(item: items[i], viewport: viewport),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _QuickAccessTile extends StatelessWidget {
  const _QuickAccessTile({required this.item, required this.viewport});

  final HomeQuickAccessItem item;
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
            minHeight: HomeLayout.quickAccessMinHeightFor(viewport),
          ),
          child: Padding(
            padding: EdgeInsets.symmetric(
              vertical: HomeLayout.quickAccessCardVerticalPadding(viewport),
              horizontal: 2,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.max,
              children: [
                Icon(
                  item.icon,
                  color: accent,
                  size: HomeLayout.quickAccessIconSize,
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