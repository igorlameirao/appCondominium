import 'package:flutter/material.dart';

import '../../../core/constants/asset_paths.dart';
import '../domain/models/home_models.dart';

/// Fonte demonstrativa centralizada — trocar por repositório/API no futuro.
abstract final class HomeDemoData {
  static const screen = HomeScreenData(
    condominium: HomeCondominiumSelection(
      id: 'cond-vista-nobre',
      name: 'Residencial Vista Nobre',
    ),
    resident: HomeResidentContext(
      displayName: 'Danilo',
      roleLabel: 'Morador',
      unitLabel: 'Torre A — Apto 302',
    ),
    notificationCount: 3,
    featuredHighlights: [
      HomeFeaturedHighlight(
        id: 'highlight-assembleia-nov',
        kind: HomeHighlightKind.assembly,
        categoryLabel: 'Assembleia',
        title: 'Assembleia Geral Ordinária',
        subtitle: '20 de Nov • 19h30',
        imageAssetPath: AssetPaths.homeBannerAssembly,
        actionLabel: 'Ver detalhes',
        destination: HomeHighlightDestination.assemblyDetail,
        sortOrder: 1,
      ),
      HomeFeaturedHighlight(
        id: 'highlight-manutencao-elevador',
        kind: HomeHighlightKind.maintenance,
        categoryLabel: 'Manutenção',
        title: 'Manutenção do Elevador',
        subtitle: '25 de Nov • 08h00 — Torre A',
        imageAssetPath: AssetPaths.homeBannerElevator,
        actionLabel: 'Ver detalhes',
        destination: HomeHighlightDestination.maintenanceDetail,
        sortOrder: 2,
      ),
      HomeFeaturedHighlight(
        id: 'highlight-coleta-seletiva',
        kind: HomeHighlightKind.announcement,
        categoryLabel: 'Comunicado',
        title: 'Coleta Seletiva',
        subtitle: 'Quarta-feira • contentores na garagem',
        actionLabel: 'Saiba mais',
        destination: HomeHighlightDestination.comingSoon,
        sortOrder: 3,
      ),
    ],
    mainShortcuts: [
      HomeShortcutItem(
        id: 'reservas',
        label: 'Reservas',
        icon: Icons.calendar_month_rounded,
      ),
      HomeShortcutItem(
        id: 'correspondencias',
        label: 'Encomendas',
        icon: Icons.mail_outline_rounded,
        badgeCount: 2,
      ),
      HomeShortcutItem(
        id: 'ocorrencias',
        label: 'Ocorrências',
        icon: Icons.warning_amber_rounded,
      ),
      HomeShortcutItem(
        id: 'financeiro',
        label: 'Financeiro',
        icon: Icons.account_balance_wallet_outlined,
      ),
    ],
    pendingItems: [
      HomePendingItem(
        id: 'taxa-condominio',
        title: 'Taxa de Condomínio',
        subtitle: 'Vencimento: 10/11/2026',
        icon: Icons.apartment_rounded,
        status: HomePendingStatus(
          label: 'Em aberto',
          kind: HomePendingStatusKind.danger,
        ),
      ),
      HomePendingItem(
        id: 'encomenda',
        title: 'Encomenda disponível',
        subtitle: 'Recebida em: 11/11/2026',
        icon: Icons.inventory_2_outlined,
        status: HomePendingStatus(
          label: 'Retirar',
          kind: HomePendingStatusKind.success,
        ),
      ),
      HomePendingItem(
        id: 'autorizacao-visita',
        title: 'Autorização de visita',
        subtitle: 'Aguardando aprovação do síndico',
        icon: Icons.badge_outlined,
        status: HomePendingStatus(
          label: 'Em aberto',
          kind: HomePendingStatusKind.neutral,
        ),
      ),
    ],
    quickAccessItems: [
      HomeQuickAccessItem(
        id: 'visitantes',
        label: 'Visitantes',
        icon: Icons.people_outline_rounded,
      ),
      HomeQuickAccessItem(
        id: 'autorizacoes',
        label: 'Autorizações',
        icon: Icons.door_front_door_outlined,
      ),
      HomeQuickAccessItem(
        id: 'documentos',
        label: 'Documentos',
        icon: Icons.folder_open_outlined,
      ),
      HomeQuickAccessItem(
        id: 'sindico',
        label: 'Síndico',
        icon: Icons.support_agent_rounded,
      ),
    ],
    announcements: HomeAnnouncementsPromo(
      title: 'Comunicados',
      description: 'Fique por dentro das novidades do condomínio.',
      imageAssetPath: AssetPaths.homeAnnouncementsCover,
    ),
  );

  static const drawerNavGroups = [
    HomeDrawerNavGroup(
      title: 'Meu Condomínio',
      items: [
        HomeDrawerNavItem(
          id: 'inicio',
          label: 'Início',
          icon: Icons.home_rounded,
        ),
        HomeDrawerNavItem(
          id: 'comunicados',
          label: 'Comunicados',
          icon: Icons.campaign_outlined,
        ),
        HomeDrawerNavItem(
          id: 'assembleias',
          label: 'Assembleias e Votações',
          icon: Icons.how_to_vote_outlined,
        ),
        HomeDrawerNavItem(
          id: 'documentos',
          label: 'Documentos',
          icon: Icons.folder_open_outlined,
        ),
      ],
    ),
    HomeDrawerNavGroup(
      title: 'Serviços',
      items: [
        HomeDrawerNavItem(
          id: 'reservas',
          label: 'Reservas de Áreas',
          icon: Icons.calendar_month_rounded,
        ),
        HomeDrawerNavItem(
          id: 'encomendas',
          label: 'Encomendas',
          icon: Icons.inventory_2_outlined,
        ),
        HomeDrawerNavItem(
          id: 'visitantes',
          label: 'Visitantes e Acessos',
          icon: Icons.people_outline_rounded,
        ),
        HomeDrawerNavItem(
          id: 'autorizacoes',
          label: 'Autorizações',
          icon: Icons.badge_outlined,
        ),
        HomeDrawerNavItem(
          id: 'ocorrencias',
          label: 'Ocorrências e Solicitações',
          icon: Icons.warning_amber_rounded,
        ),
      ],
    ),
    HomeDrawerNavGroup(
      title: 'Financeiro',
      items: [
        HomeDrawerNavItem(
          id: 'taxas',
          label: 'Taxas e Boletos',
          icon: Icons.receipt_long_outlined,
        ),
        HomeDrawerNavItem(
          id: 'historico-financeiro',
          label: 'Histórico Financeiro',
          icon: Icons.history_rounded,
        ),
      ],
    ),
  ];

  static const bottomNavItems = [
    HomeBottomNavItem(
      destination: HomeBottomNavDestination.inicio,
      label: 'Início',
      icon: Icons.home_rounded,
    ),
    HomeBottomNavItem(
      destination: HomeBottomNavDestination.reservas,
      label: 'Reservas',
      icon: Icons.calendar_month_rounded,
    ),
    HomeBottomNavItem(
      destination: HomeBottomNavDestination.ocorrencias,
      label: 'Ocorrências',
      icon: Icons.warning_amber_rounded,
    ),
    HomeBottomNavItem(
      destination: HomeBottomNavDestination.financeiro,
      label: 'Financeiro',
      icon: Icons.account_balance_wallet_outlined,
    ),
    HomeBottomNavItem(
      destination: HomeBottomNavDestination.mais,
      label: 'Mais',
      icon: Icons.apps_rounded,
    ),
  ];
}
