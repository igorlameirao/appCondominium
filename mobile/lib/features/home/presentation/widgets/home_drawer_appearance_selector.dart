import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/theme_mode_controller.dart';
import '../theme/home_surface.dart';

class HomeDrawerAppearanceSelector extends ConsumerWidget {
  const HomeDrawerAppearanceSelector({super.key});

  static const _labelStyle = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w600,
    height: 1.1,
  );

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = ref.watch(themeModeControllerProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final dividerColor = isDark
        ? Colors.white.withValues(alpha: 0.12)
        : AppColors.neutral100;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Divider(height: 1, color: dividerColor),
        Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg,
            AppSpacing.sm,
            AppSpacing.lg,
            AppSpacing.xs,
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
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg,
            0,
            AppSpacing.lg,
            AppSpacing.sm,
          ),
          child: SegmentedButton<ThemeMode>(
            segments: [
              ButtonSegment(
                value: ThemeMode.light,
                label: const Text(
                  'Claro',
                  maxLines: 1,
                  softWrap: false,
                  style: _labelStyle,
                ),
                icon: const Icon(Icons.light_mode_outlined, size: 18),
              ),
              ButtonSegment(
                value: ThemeMode.dark,
                label: const Text(
                  'Escuro',
                  maxLines: 1,
                  softWrap: false,
                  style: _labelStyle,
                ),
                icon: const Icon(Icons.dark_mode_outlined, size: 18),
              ),
              ButtonSegment(
                value: ThemeMode.system,
                label: const Text(
                  'Sistema',
                  maxLines: 1,
                  softWrap: false,
                  style: _labelStyle,
                ),
                icon: const Icon(Icons.brightness_auto_outlined, size: 18),
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
              padding: const WidgetStatePropertyAll(
                EdgeInsets.symmetric(horizontal: 2, vertical: 4),
              ),
              textStyle: const WidgetStatePropertyAll(_labelStyle),
            ),
          ),
        ),
      ],
    );
  }
}