import 'dart:ui';

import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';

class AuthCard extends StatelessWidget {
  const AuthCard({
    super.key,
    required this.isDark,
    required this.child,
  });

  final bool isDark;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(AppSpacing.cardRadius);

    if (isDark) {
      return ClipRRect(
        borderRadius: radius,
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 26, sigmaY: 26),
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: const Color(0xFF08192C).withValues(alpha: 0.30),
              borderRadius: radius,
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.22),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.22),
                  blurRadius: 18,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.cardPaddingH,
                vertical: AppSpacing.cardPadding,
              ),
              child: child,
            ),
          ),
        ),
      );
    }

    return ClipRRect(
      borderRadius: radius,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.86),
            borderRadius: radius,
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.95),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF063B6E).withValues(alpha: 0.07),
                blurRadius: 22,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.cardPaddingH,
              vertical: AppSpacing.cardPadding,
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}
