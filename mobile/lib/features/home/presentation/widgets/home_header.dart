import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/asset_paths.dart';
import '../../../../shared/widgets/auth/coming_soon_message.dart';
import '../../../units/application/selected_unit_notifier.dart';
import '../../../context/presentation/context_switch_sheets.dart';
import '../../domain/models/home_models.dart';

class HomeHeader extends ConsumerWidget {
  const HomeHeader({
    super.key,
    required this.condominium,
    required this.notificationCount,
    required this.resident,
  });

  final HomeCondominiumSelection condominium;
  final int notificationCount;
  final HomeResidentContext resident;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final primary = HomeHeader._primaryText(context);
    final vinculosAsync = ref.watch(vinculosAtivosProvider);
    final canSwitchCondominio = vinculosAsync.maybeWhen(
      data: (vinculos) => vinculos.length > 1,
      orElse: () => false,
    );

    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        IconButton(
          onPressed: () => Scaffold.of(context).openDrawer(),
          icon: Icon(Icons.menu_rounded, color: primary, size: 24),
          visualDensity: VisualDensity.compact,
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(minWidth: 38, minHeight: 38),
        ),
        Expanded(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Image.asset(
                    AssetPaths.logoAppCondominiumIcon,
                    height: 32,
                    fit: BoxFit.contain,
                  ),
                  const SizedBox(width: 6),
                  Flexible(
                    child: Text(
                      'AppCondominium',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            color: primary,
                            fontWeight: FontWeight.w700,
                            fontSize: 15,
                            height: 1.1,
                          ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 1),
              _CondominiumNameRow(
                name: condominium.name,
                canSwitch: canSwitchCondominio,
                loadingVinculos: vinculosAsync.isLoading,
                onTap: () => showTrocarCondominioSheet(context, ref),
              ),
            ],
          ),
        ),
        Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            _NotificationBell(count: notificationCount, color: primary),
            const SizedBox(width: 4),
            _UserAvatar(resident: resident),
          ],
        ),
      ],
    );
  }

  static Color _primaryText(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return isDark ? Colors.white : AppColors.textNavy;
  }

  static Color _secondaryText(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return isDark ? AppColors.textMutedDark : AppColors.textMutedLight;
  }
}

class _CondominiumNameRow extends StatelessWidget {
  const _CondominiumNameRow({
    required this.name,
    required this.canSwitch,
    required this.loadingVinculos,
    required this.onTap,
  });

  final String name;
  final bool canSwitch;
  final bool loadingVinculos;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final style = Theme.of(context).textTheme.bodySmall?.copyWith(
          color: HomeHeader._secondaryText(context),
          fontWeight: FontWeight.w500,
        );

    final label = Flexible(
      child: Text(
        name,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: style,
      ),
    );

    if (!canSwitch) {
      return Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.xs,
          vertical: 2,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [label],
        ),
      );
    }

    return InkWell(
      onTap: loadingVinculos ? null : onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.xs,
          vertical: 2,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            label,
            Icon(
              Icons.keyboard_arrow_down_rounded,
              size: 18,
              color: HomeHeader._secondaryText(context),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotificationBell extends StatelessWidget {
  const _NotificationBell({required this.count, required this.color});

  final int count;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => showComingSoonMessage(context),
      customBorder: const CircleBorder(),
      child: SizedBox(
        width: 40,
        height: 40,
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.center,
          children: [
            Icon(Icons.notifications_outlined, color: color, size: 24),
            if (count > 0)
              Positioned(
                top: 4,
                right: 4,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                  decoration: BoxDecoration(
                    color: AppColors.statusDanger,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '$count',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      height: 1.1,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _UserAvatar extends StatelessWidget {
  const _UserAvatar({required this.resident});

  final HomeResidentContext resident;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return InkWell(
      onTap: () => showComingSoonMessage(context),
      customBorder: const CircleBorder(),
      child: CircleAvatar(
        radius: 19,
        backgroundColor: isDark
            ? AppColors.navyCard
            : AppColors.neutral100,
        foregroundImage: resident.avatarAssetPath != null
            ? AssetImage(resident.avatarAssetPath!)
            : null,
        child: resident.avatarAssetPath == null
            ? Icon(
                Icons.person_rounded,
                color: isDark ? AppColors.cyanSoft : AppColors.bluePrimary,
                size: 22,
              )
            : null,
      ),
    );
  }
}
