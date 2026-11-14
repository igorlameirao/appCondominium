import 'package:flutter/material.dart';

/// Contexto do morador na unidade atual (substituível por API).
class HomeResidentContext {
  const HomeResidentContext({
    required this.displayName,
    required this.roleLabel,
    required this.unitLabel,
    this.avatarAssetPath,
  });

  final String displayName;
  final String roleLabel;
  final String unitLabel;
  final String? avatarAssetPath;
}

/// Condomínio selecionado — preparado para lista e troca futura.
class HomeCondominiumSelection {
  const HomeCondominiumSelection({
    required this.id,
    required this.name,
  });

  final String id;
  final String name;
}

enum HomePendingStatusKind { danger, success, neutral }

class HomePendingStatus {
  const HomePendingStatus({
    required this.label,
    required this.kind,
  });

  final String label;
  final HomePendingStatusKind kind;
}

class HomePendingItem {
  const HomePendingItem({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.status,
  });

  final String id;
  final String title;
  final String subtitle;
  final IconData icon;
  final HomePendingStatus status;
}

/// Categoria do destaque exibido no carrossel da Home.
enum HomeHighlightKind {
  assembly,
  announcement,
  maintenance,
  other,
}

/// Destino demonstrativo — substituível por rotas reais (GoRouter).
enum HomeHighlightDestination {
  comingSoon,
  announcements,
  maintenanceDetail,
  assemblyDetail,
}

/// Destaque unificado: assembleias, comunicados, manutenções e similares.
class HomeFeaturedHighlight {
  const HomeFeaturedHighlight({
    required this.id,
    required this.kind,
    required this.categoryLabel,
    required this.title,
    required this.subtitle,
    required this.actionLabel,
    required this.destination,
    required this.sortOrder,
    this.imageAssetPath,
  });

  final String id;
  final HomeHighlightKind kind;
  final String categoryLabel;
  final String title;
  /// Data, horário ou descrição curta.
  final String subtitle;
  final String? imageAssetPath;
  final String actionLabel;
  final HomeHighlightDestination destination;
  final int sortOrder;
}

class HomeShortcutItem {
  const HomeShortcutItem({
    required this.id,
    required this.label,
    required this.icon,
    this.badgeCount,
  });

  final String id;
  final String label;
  final IconData icon;
  final int? badgeCount;
}

class HomeQuickAccessItem {
  const HomeQuickAccessItem({
    required this.id,
    required this.label,
    required this.icon,
  });

  final String id;
  final String label;
  final IconData icon;
}

class HomeAnnouncementsPromo {
  const HomeAnnouncementsPromo({
    required this.title,
    required this.description,
    required this.imageAssetPath,
  });

  final String title;
  final String description;
  final String imageAssetPath;
}

class HomeScreenData {
  const HomeScreenData({
    required this.condominium,
    required this.resident,
    required this.notificationCount,
    required this.featuredHighlights,
    required this.mainShortcuts,
    required this.pendingItems,
    required this.quickAccessItems,
    required this.announcements,
  });

  final HomeCondominiumSelection condominium;
  final HomeResidentContext resident;
  final int notificationCount;
  final List<HomeFeaturedHighlight> featuredHighlights;
  final List<HomeShortcutItem> mainShortcuts;
  final List<HomePendingItem> pendingItems;
  final List<HomeQuickAccessItem> quickAccessItems;
  final HomeAnnouncementsPromo announcements;
}

enum HomeBottomNavDestination {
  inicio,
  reservas,
  ocorrencias,
  financeiro,
  mais,
}

class HomeBottomNavItem {
  const HomeBottomNavItem({
    required this.destination,
    required this.label,
    required this.icon,
  });

  final HomeBottomNavDestination destination;
  final String label;
  final IconData icon;
}

/// Item do menu lateral — `enabled` reservado para permissões futuras.
class HomeDrawerNavItem {
  const HomeDrawerNavItem({
    required this.id,
    required this.label,
    required this.icon,
    this.enabled = true,
  });

  final String id;
  final String label;
  final IconData icon;
  final bool enabled;
}

class HomeDrawerNavGroup {
  const HomeDrawerNavGroup({
    required this.title,
    required this.items,
  });

  final String title;
  final List<HomeDrawerNavItem> items;
}
