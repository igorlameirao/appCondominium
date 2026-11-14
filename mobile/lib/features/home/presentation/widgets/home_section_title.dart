import 'package:flutter/material.dart';

import '../../../../app/theme/app_spacing.dart';
import '../theme/home_surface.dart';

class HomeSectionTitle extends StatelessWidget {
  const HomeSectionTitle({
    super.key,
    required this.title,
    required this.icon,
    this.iconColor,
    this.trailing,
  });

  final String title;
  final IconData icon;
  final Color? iconColor;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(
          icon,
          size: 18,
          color: iconColor ?? HomeSurface.iconAccent(context),
        ),
        const SizedBox(width: AppSpacing.xs),
        Expanded(
          child: Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: HomeSurface.primaryText(context),
                  fontWeight: FontWeight.w800,
                ),
          ),
        ),
        ?trailing,
      ],
    );
  }
}
