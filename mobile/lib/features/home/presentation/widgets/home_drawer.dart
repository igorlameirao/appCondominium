import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router.dart';
import '../../../auth/application/auth_session_notifier.dart';
import '../../../context/presentation/context_switch_sheets.dart';
import '../../../../shared/widgets/auth/coming_soon_message.dart';
import '../providers/home_providers.dart';
import '../theme/home_surface.dart';
import 'home_drawer_appearance_selector.dart';
import 'home_drawer_footer.dart';
import 'home_drawer_header.dart';
import 'home_drawer_nav_group.dart';
import '../../domain/models/home_models.dart';

/// Menu lateral da Home — navegação demonstrativa e preferências locais.
class HomeDrawer extends ConsumerWidget {
  const HomeDrawer({super.key});

  Future<void> _signOut(BuildContext context, WidgetRef ref) async {
    Navigator.of(context).pop();
    await ref.read(authSessionProvider.notifier).logout();
    if (context.mounted) {
      context.go(AppRoute.login.path);
    }
  }

  void _onNavItem(BuildContext context, WidgetRef ref, HomeDrawerNavItem item) {
    switch (item.id) {
      case 'inicio':
        Navigator.of(context).pop();
        return;
      case 'trocar-condominio':
        Navigator.of(context).pop();
        showTrocarCondominioSheet(context, ref);
        return;
      case 'trocar-perfil':
        Navigator.of(context).pop();
        showTrocarPerfilSheet(context, ref);
        return;
      case 'trocar-unidade':
        Navigator.of(context).pop();
        showTrocarUnidadeSheet(context, ref);
        return;
      default:
        Navigator.of(context).pop();
        showComingSoonMessage(context);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final screen = ref.watch(homeScreenDataProvider);
    final groups = ref.watch(homeDrawerNavGroupsProvider);
    final width = math.min(MediaQuery.sizeOf(context).width * 0.86, 304.0);

    return Drawer(
      width: width,
      backgroundColor: HomeSurface.pageBackground(context),
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            HomeDrawerHeader(
              resident: screen.resident,
              condominium: screen.condominium,
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.only(bottom: 8),
                children: [
                  for (final group in groups)
                    HomeDrawerNavGroupSection(
                      group: group,
                      onItemSelected: (item) => _onNavItem(context, ref, item),
                    ),
                ],
              ),
            ),
            const HomeDrawerAppearanceSelector(),
            HomeDrawerFooter(onSignOut: () => _signOut(context, ref)),
          ],
        ),
      ),
    );
  }
}