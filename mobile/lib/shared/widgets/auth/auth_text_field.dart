import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';

class AuthTextField extends StatelessWidget {
  const AuthTextField({
    super.key,
    required this.hint,
    required this.isDark,
    this.obscureText = false,
    this.suffix,
    this.controller,
    this.textInputAction,
  });

  final String hint;
  final bool isDark;
  final bool obscureText;
  final Widget? suffix;
  final TextEditingController? controller;
  final TextInputAction? textInputAction;

  @override
  Widget build(BuildContext context) {
    final borderColor =
        isDark ? AppColors.fieldBorderDark : AppColors.fieldBorderLight;
    final fillColor =
        isDark ? AppColors.fieldFillDark : Colors.white.withValues(alpha: 0.85);
    final textColor = isDark ? Colors.white : AppColors.textNavy;
    final hintColor =
        isDark ? AppColors.textMutedDark : AppColors.textMutedLight;

    return TextField(
      controller: controller,
      obscureText: obscureText,
      textInputAction: textInputAction,
      style: TextStyle(
        color: textColor,
        fontWeight: FontWeight.w300,
        fontSize: 14,
      ),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(
          color: hintColor,
          fontWeight: FontWeight.w300,
          fontSize: 13,
        ),
        filled: true,
        fillColor: fillColor,
        prefixIcon: Icon(
          hint == 'Senha' ? Icons.lock_outline_rounded : Icons.person_outline_rounded,
          color: isDark
              ? AppColors.textMutedDark
              : AppColors.textMutedLight,
          size: 18,
        ),
        suffixIcon: suffix,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: 10,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.fieldRadius),
          borderSide: BorderSide(color: borderColor, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.fieldRadius),
          borderSide: BorderSide(
            color: isDark ? AppColors.cyanBright : AppColors.bluePrimary,
            width: 1.1,
          ),
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.fieldRadius),
        ),
      ),
    );
  }
}
