import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/home_demo_data.dart';
import '../../domain/models/home_models.dart';

final homeScreenDataProvider = Provider<HomeScreenData>(
  (ref) => HomeDemoData.screen,
);

final homeBottomNavItemsProvider = Provider<List<HomeBottomNavItem>>(
  (ref) => HomeDemoData.bottomNavItems,
);

final homeBottomNavIndexProvider = StateProvider<int>((ref) => 0);

final homeDrawerNavGroupsProvider = Provider<List<HomeDrawerNavGroup>>(
  (ref) => HomeDemoData.drawerNavGroups,
);
