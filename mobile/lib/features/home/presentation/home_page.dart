import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'providers/home_providers.dart';
import 'theme/home_layout.dart';
import 'widgets/home_background.dart';
import 'widgets/home_bottom_navigation.dart';
import 'widgets/home_featured_banner.dart';
import 'widgets/home_greeting.dart';
import 'widgets/home_header.dart';
import 'widgets/home_main_shortcuts.dart';
import 'widgets/home_pending_section.dart';
import 'widgets/home_drawer.dart';
import 'widgets/home_quick_access_section.dart';

/// Página inicial demonstrativa — estrutura pronta para dados reais.
class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(homeScreenDataProvider);
    final navItems = ref.watch(homeBottomNavItemsProvider);
    final navIndex = ref.watch(homeBottomNavIndexProvider);

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      drawer: const HomeDrawer(),
      backgroundColor: HomeBackground.baseColor(isDark),
      extendBody: false,
      body: LayoutBuilder(
        builder: (context, viewport) {
          return Stack(
            fit: StackFit.expand,
            children: [
              const HomeBackground(),
              SafeArea(
                bottom: false,
                child: CustomScrollView(
                  physics: const ClampingScrollPhysics(),
                  slivers: [
                    SliverPadding(
                      padding: EdgeInsets.fromLTRB(
                        HomeLayout.pageHorizontalPadding,
                        HomeLayout.pageTopPadding(viewport),
                        HomeLayout.pageHorizontalPadding,
                        HomeLayout.pageBottomPadding(viewport),
                      ),
                      sliver: SliverList(
                        delegate: SliverChildListDelegate.fixed([
                          HomeHeader(
                            condominium: data.condominium,
                            notificationCount: data.notificationCount,
                            resident: data.resident,
                          ),
                          SizedBox(
                            height: HomeLayout.gapAfterHeader(viewport),
                          ),
                          HomeGreeting(
                            resident: data.resident,
                            viewport: viewport,
                          ),
                          SizedBox(
                            height: HomeLayout.gapAfterGreeting(viewport),
                          ),
                          HomeFeaturedBannerCarousel(
                            highlights: data.featuredHighlights,
                            viewport: viewport,
                          ),
                          SizedBox(
                            height: HomeLayout.gapAfterBanner(viewport),
                          ),
                          HomeMainShortcuts(
                            items: data.mainShortcuts,
                            viewport: viewport,
                          ),
                          SizedBox(
                            height: HomeLayout.gapBetweenMajorSections(
                              viewport,
                            ),
                          ),
                          HomePendingSection(
                            items: data.pendingItems,
                            viewport: viewport,
                          ),
                          SizedBox(
                            height: HomeLayout.gapBetweenMajorSections(
                              viewport,
                            ),
                          ),
                          HomeQuickAccessSection(
                            items: data.quickAccessItems,
                            viewport: viewport,
                          ),
                        ]),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
      bottomNavigationBar: HomeBottomNavigation(
        items: navItems,
        selectedIndex: navIndex,
        onSelected: (index) =>
            ref.read(homeBottomNavIndexProvider.notifier).state = index,
      ),
    );
  }
}
