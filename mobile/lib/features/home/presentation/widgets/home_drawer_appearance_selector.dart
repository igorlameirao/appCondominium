import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/theme_mode_controller.dart';
import '../theme/home_surface.dart';

class HomeDrawerAppearanceSelector extends ConsumerWidget {
  const HomeDrawerAppearanceSelector({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = ref.watch(themeModeControllerProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final dividerColor = isDark
        ? Colors.white.withValues(alpha: 0.12)
        : AppColors.neutral100;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Divider(height: 1, color: dividerColor),
        Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg,
            AppSpacing.md,
            AppSpacing.lg,
            AppSpacing.sm,
          ),
          child: Text(
            'Aparência',
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: HomeSurface.secondaryText(context),
                  fontWeight: FontWeight.w700,
                ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          child: SegmentedButton<ThemeMode>(
            segments: const [
              ButtonSegment(
                value: ThemeMode.light,
                label: Text('Claro'),
                icon: Icon(Icons.light_mode_outlined, size: 18),
              ),
              ButtonSegment(
                value: ThemeMode.dark,
                label: Text('Escuro'),
                icon: Icon(Icons.dark_mode_outlined, size: 18),
              ),
              ButtonSegment(
                value: ThemeMode.system,
                label: Text('Sistema'),
                icon: Icon(Icons.brightness_auto_outlined, size: 18),
              ),
            ],
            selected: {current},
            onSelectionChanged: (selection) {
              ref
                  .read(themeModeControllerProvider.notifier)
                  .setThemeMode(selection.first);
            },
            style: ButtonStyle(
              visualDensity: VisualDensity.compact,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              textStyle: WidgetStatePropertyAll(
                Theme.of(context).textTheme.labelSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
      ],
    );
  }
}