import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_spacing.dart';
import 'providers/home_providers.dart';
import 'theme/home_layout.dart';
import 'theme/home_surface.dart';
import 'widgets/home_background.dart';
import 'widgets/home_pending_item_tile.dart';

/// Listagem demonstrativa de todas as pendências ([HomeDemoData]).
class HomePendingListPage extends ConsumerWidget {
  const HomePendingListPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(homeScreenDataProvider).pendingItems;

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_rounded,
            color: HomeSurface.primaryText(context),
          ),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Minhas Pendências',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: HomeSurface.primaryText(context),
                fontWeight: FontWeight.w800,
              ),
        ),
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          const HomeBackground(),
          SafeArea(
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(
                HomeLayout.pageHorizontalPadding,
                AppSpacing.xs,
                HomeLayout.pageHorizontalPadding,
                AppSpacing.lg,
              ),
              itemCount: items.length,
              separatorBuilder: (context, index) =>
                  const SizedBox(height: AppSpacing.xs),
              itemBuilder: (context, index) {
                return HomePendingItemTile(item: items[index]);
              },
            ),
          ),
        ],
      ),
    );
  }
}
