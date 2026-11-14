import 'package:flutter/material.dart';

import '../../domain/models/home_models.dart';
import '../theme/home_layout.dart';
import '../theme/home_surface.dart';

class HomeGreeting extends StatelessWidget {
  const HomeGreeting({
    super.key,
    required this.resident,
    required this.viewport,
  });

  final HomeResidentContext resident;
  final BoxConstraints viewport;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Olá, ${resident.displayName}!',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: HomeSurface.primaryText(context),
                fontWeight: FontWeight.w800,
                fontSize: HomeLayout.greetingTitleFontSize(viewport),
                height: 1.12,
              ),
        ),
        SizedBox(height: HomeLayout.greetingSubtitleGap(viewport)),
        Row(
          children: [
            Icon(
              Icons.person_outline_rounded,
              size: 16,
              color: HomeSurface.secondaryText(context),
            ),
            const SizedBox(width: 4),
            Expanded(
              child: Text(
                '${resident.roleLabel} • ${resident.unitLabel}',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: HomeSurface.secondaryText(context),
                      fontWeight: FontWeight.w500,
                    ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
