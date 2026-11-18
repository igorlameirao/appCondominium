import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';

class AuthTextField extends StatelessWidget {
  const AuthTextField({
    super.key,
    required this.hint,
    required this.isDark,
    this.label,
    this.prefixIcon,
    this.compact = false,
    this.obscureText = false,
    this.suffix,
    this.controller,
    this.textInputAction,
    this.autofillHints,
    this.keyboardType,
    this.onEditingComplete,
    this.onSubmitted,
  });

  final String hint;
  final String? label;
  final IconData? prefixIcon;
  final bool compact;
  final bool isDark;
  final bool obscureText;
  final Widget? suffix;
  final TextEditingController? controller;
  final TextInputAction? textInputAction;
  final Iterable<String>? autofillHints;
  final TextInputType? keyboardType;
  final VoidCallback? onEditingComplete;
  final ValueChanged<String>? onSubmitted;

  IconData _defaultPrefixIcon() {
    if (hint == 'Senha' || obscureText) {
      return Icons.lock_outline_rounded;
    }
    return Icons.person_outline_rounded;
  }

  @override
  Widget build(BuildContext context) {
    final borderColor =
        isDark ? AppColors.fieldBorderDark : AppColors.fieldBorderLight;
    final fillColor =
        isDark ? AppColors.fieldFillDark : Colors.white.withValues(alpha: 0.85);
    final textColor = isDark ? Colors.white : AppColors.textNavy;
    final hintColor =
        isDark ? AppColors.textMutedDark : AppColors.textMutedLight;
    final mutedIcon =
        isDark ? AppColors.textMutedDark : AppColors.textMutedLight;

    final field = TextField(
      controller: controller,
      obscureText: obscureText,
      textInputAction: textInputAction,
      autofillHints: autofillHints,
      keyboardType: keyboardType,
      autocorrect: false,
      enableSuggestions: !obscureText,
      onEditingComplete: onEditingComplete,
      onSubmitted: onSubmitted,
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
          prefixIcon ?? _defaultPrefixIcon(),
          color: mutedIcon,
          size: 18,
        ),
        suffixIcon: suffix,
        isDense: true,
        contentPadding: EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: compact ? 12 : 10,
        ),
        constraints: compact
            ? const BoxConstraints(minHeight: 50, maxHeight: 54)
            : const BoxConstraints(),
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

    if (label == null) return field;

    final labelColor = isDark ? AppColors.textMutedDark : AppColors.textNavy;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          label!,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: labelColor,
            height: 1.2,
          ),
        ),
        const SizedBox(height: AppSpacing.xxs),
        field,
      ],
    );
  }
}
