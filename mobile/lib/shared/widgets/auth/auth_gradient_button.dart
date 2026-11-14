import 'package:flutter/material.dart';

import '../../../app/theme/app_gradients.dart';
import '../../../app/theme/app_spacing.dart';

class AuthGradientButton extends StatelessWidget {
  const AuthGradientButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
  });

  final String label;
  final VoidCallback onPressed;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(AppSpacing.buttonRadius);

    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: radius,
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF00C9E0).withValues(alpha: 0.24),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: radius,
        child: Material(
          type: MaterialType.transparency,
          child: InkWell(
            onTap: onPressed,
            child: Ink(
              decoration: const BoxDecoration(gradient: AppGradients.primaryButton),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  vertical: AppSpacing.sm + 1,
                  horizontal: AppSpacing.md,
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Text(
                      label,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                    ),
                    if (icon != null)
                      Positioned(
                        right: 2,
                        child: Icon(icon, color: Colors.white, size: 20),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
