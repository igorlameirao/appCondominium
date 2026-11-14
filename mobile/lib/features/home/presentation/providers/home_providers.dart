import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../auth/application/auth_session_notifier.dart';
import '../../../units/application/selected_unit_notifier.dart';
import '../../data/home_demo_data.dart';
import '../../domain/models/home_models.dart';

final homeScreenDataProvider = Provider<HomeScreenData>((ref) {
  final demo = HomeDemoData.screen;
  final auth = ref.watch(authSessionProvider);
  ref.watch(tenantContextGenerationProvider);
  final unit = ref.watch(selectedUnitProvider);

  if (!auth.isAuthenticated) {
    return HomeScreenData(
      condominium: const HomeCondominiumSelection(id: '', name: '—'),
      resident: const HomeResidentContext(
        displayName: '—',
        roleLabel: '—',
        unitLabel: '—',
      ),
      notificationCount: demo.notificationCount,
      featuredHighlights: demo.featuredHighlights,
      mainShortcuts: demo.mainShortcuts,
      pendingItems: demo.pendingItems,
      quickAccessItems: demo.quickAccessItems,
      announcements: demo.announcements,
    );
  }

  return HomeScreenData(
    condominium: HomeCondominiumSelection(
      id: auth.idCondominio.toString(),
      name: auth.condominioNome ?? 'Condomínio ${auth.idCondominio}',
    ),
    resident: HomeResidentContext(
      displayName: auth.nome ?? '—',
      roleLabel: auth.perfil ?? '—',
      unitLabel: unit.displayLabel,
      avatarAssetPath: null,
    ),
    notificationCount: demo.notificationCount,
    featuredHighlights: demo.featuredHighlights,
    mainShortcuts: demo.mainShortcuts,
    pendingItems: demo.pendingItems,
    quickAccessItems: demo.quickAccessItems,
    announcements: demo.announcements,
  );
});

final homeBottomNavItemsProvider = Provider<List<HomeBottomNavItem>>(
  (ref) => HomeDemoData.bottomNavItems,
);

final homeBottomNavIndexProvider = StateProvider<int>((ref) => 0);

final homeDrawerNavGroupsProvider = Provider<List<HomeDrawerNavGroup>>(
  (ref) => HomeDemoData.drawerNavGroupsWithContext,
);
