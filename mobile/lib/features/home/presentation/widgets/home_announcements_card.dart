import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../shared/widgets/auth/coming_soon_message.dart';
import '../../domain/models/home_models.dart';
import '../theme/home_surface.dart';

class HomeAnnouncementsCard extends StatelessWidget {
  const HomeAnnouncementsCard({super.key, required this.promo});

  final HomeAnnouncementsPromo promo;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => showComingSoonMessage(context),
        borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
        child: Ink(
          decoration: HomeSurface.cardDecoration(context),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
            child: Row(
              children: [
                Image.asset(
                  promo.imageAssetPath,
                  width: 72,
                  height: 72,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Container(
                    width: 72,
                    height: 72,
                    color: AppColors.neutral100,
                    child: Icon(
                      Icons.apartment_rounded,
                      color: AppColors.bluePrimary.withValues(alpha: 0.45),
                    ),
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.sm + 2,
                      vertical: AppSpacing.xs + 2,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          promo.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style:
                              Theme.of(context).textTheme.titleSmall?.copyWith(
                                    color: HomeSurface.iconAccent(context),
                                    fontWeight: FontWeight.w800,
                                    fontSize: 14,
                                  ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          promo.description,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: HomeSurface.secondaryText(context),
                                    fontSize: 12,
                                    height: 1.25,
                                  ),
                        ),
                      ],
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(right: AppSpacing.sm),
                  child: Material(
                    color: isDark
                        ? AppColors.cyanBright.withValues(alpha: 0.18)
                        : AppColors.neutral100,
                    shape: const CircleBorder(),
                    child: InkWell(
                      onTap: () => showComingSoonMessage(context),
                      customBorder: const CircleBorder(),
                      child: Padding(
                        padding: const EdgeInsets.all(8),
                        child: Icon(
                          Icons.arrow_forward_rounded,
                          color: HomeSurface.iconAccent(context),
                          size: 18,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
