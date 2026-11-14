import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../core/constants/asset_paths.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/theme_mode_controller.dart';
import '../../../shared/widgets/auth/auth_background.dart';
import '../../../shared/widgets/auth/auth_card.dart';
import '../../../shared/widgets/auth/auth_footer.dart';
import '../../../shared/widgets/auth/auth_gradient_button.dart';
import '../../../shared/widgets/auth/auth_header.dart';
import '../../../shared/widgets/auth/auth_or_divider.dart';
import '../../../shared/widgets/auth/auth_outline_button.dart';
import '../../../shared/widgets/auth/auth_text_field.dart';
import '../../../shared/widgets/auth/coming_soon_message.dart';

/// Tela de login — fase de prototipação visual (sem autenticação real).
class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  var _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _enterPrototypeHome() {
    // PROTÓTIPO: navegação direta sem validação — remover quando houver auth real.
    context.go(AppRoute.home.path);
  }

  void _showGoogleLoginComingSoon() {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        const SnackBar(
          content: Text('Login com Google disponível em breve.'),
          duration: Duration(seconds: 2),
        ),
      );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final themeMode = ref.watch(themeModeControllerProvider);
    final bottomSafe = MediaQuery.viewPaddingOf(context).bottom;
    final keyboardInset = MediaQuery.viewInsetsOf(context).bottom;
    final keyboardOpen = keyboardInset > 0;

    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: AuthBackground(
        isDark: isDark,
        child: Stack(
          children: [
            SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                child: Column(
                  children: [
                    Expanded(
                      child: LayoutBuilder(
                        builder: (context, viewportConstraints) {
                          return SingleChildScrollView(
                        physics: const ClampingScrollPhysics(),
                        keyboardDismissBehavior:
                            ScrollViewKeyboardDismissBehavior.onDrag,
                        padding: EdgeInsets.only(
                          bottom: keyboardOpen ? AppSpacing.xs : 0,
                        ),
                        child: ConstrainedBox(
                          constraints: BoxConstraints(
                            minHeight: keyboardOpen
                                ? 0
                                : viewportConstraints.maxHeight,
                          ),
                          child: _LoginMainBlock(
                            keyboardOpen: keyboardOpen,
                            viewportHeight: viewportConstraints.maxHeight,
                            isDark: isDark,
                            card: AuthCard(
                              isDark: isDark,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    'Bem-vindo(a)!',
                                    textAlign: TextAlign.start,
                                    style: AppTypography.welcomeTitle(
                                      context,
                                      isDark: isDark,
                                    ),
                                  ),
                                  const SizedBox(height: AppSpacing.xxs + 1),
                                  Text(
                                    'Acesse sua conta para continuar',
                                    textAlign: TextAlign.start,
                                    style: AppTypography.welcomeSubtitle(
                                      context,
                                      isDark: isDark,
                                    ),
                                  ),
                                  const SizedBox(height: AppSpacing.sm + 2),
                                  AuthTextField(
                                    hint: 'E-mail ou CPF',
                                    isDark: isDark,
                                    controller: _emailController,
                                    textInputAction: TextInputAction.next,
                                  ),
                                  const SizedBox(height: AppSpacing.xs + 2),
                                  AuthTextField(
                                    hint: 'Senha',
                                    isDark: isDark,
                                    obscureText: _obscurePassword,
                                    controller: _passwordController,
                                    textInputAction: TextInputAction.done,
                                    suffix: IconButton(
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(
                                        minWidth: 36,
                                        minHeight: 36,
                                      ),
                                      onPressed: () => setState(
                                        () =>
                                            _obscurePassword = !_obscurePassword,
                                      ),
                                      icon: Icon(
                                        _obscurePassword
                                            ? Icons.visibility_outlined
                                            : Icons.visibility_off_outlined,
                                        color: isDark
                                            ? AppColors.textMutedDark
                                            : AppColors.textMutedLight,
                                        size: 18,
                                      ),
                                    ),
                                  ),
                                  Align(
                                    alignment: Alignment.centerRight,
                                    child: TextButton(
                                      style: TextButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 0,
                                          vertical: AppSpacing.xxs,
                                        ),
                                        minimumSize: Size.zero,
                                        tapTargetSize:
                                            MaterialTapTargetSize.shrinkWrap,
                                      ),
                                      onPressed: () =>
                                          showComingSoonMessage(context),
                                      child: const Text(
                                        'Esqueceu sua senha?',
                                        style: TextStyle(
                                          color: AppColors.cyanBright,
                                          fontWeight: FontWeight.w500,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: AppSpacing.xxs + 2),
                                  AuthGradientButton(
                                    label: 'Entrar',
                                    icon: Icons.arrow_forward_rounded,
                                    onPressed: _enterPrototypeHome,
                                  ),
                                  AuthOrDivider(isDark: isDark),
                                  AuthOutlineButton(
                                    label: 'Continuar com o Google',
                                    isDark: isDark,
                                    iconAsset: AssetPaths.googleG,
                                    onPressed: _showGoogleLoginComingSoon,
                                  ),
                                ],
                              ),
                            ),
                          ),
                          ),
                        );
                        },
                      ),
                    ),
                    if (!keyboardOpen)
                      Padding(
                        padding: EdgeInsets.only(
                          top: AppSpacing.xs,
                          bottom: bottomSafe + AppSpacing.sm,
                        ),
                        child: AuthFooter(isDark: isDark),
                      ),
                  ],
                ),
              ),
            ),
            Positioned(
              top: MediaQuery.paddingOf(context).top + AppSpacing.xxs,
              right: AppSpacing.sm,
              child: IconButton.filledTonal(
                tooltip: 'Alternar tema (provisório)',
                onPressed: () =>
                    ref.read(themeModeControllerProvider.notifier).cycleForDemo(),
                icon: Icon(_themeToggleIcon(themeMode), size: 20),
                style: IconButton.styleFrom(
                  visualDensity: VisualDensity.compact,
                  backgroundColor: isDark
                      ? Colors.white.withValues(alpha: 0.12)
                      : Colors.white.withValues(alpha: 0.85),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _themeToggleIcon(ThemeMode mode) {
    return switch (mode) {
      ThemeMode.light => Icons.light_mode_outlined,
      ThemeMode.dark => Icons.dark_mode_outlined,
      ThemeMode.system => Icons.brightness_auto_outlined,
    };
  }
}

/// Cabeçalho + cartão com espaço livre distribuído de forma equilibrada.
class _LoginMainBlock extends StatelessWidget {
  const _LoginMainBlock({
    required this.keyboardOpen,
    required this.viewportHeight,
    required this.isDark,
    required this.card,
  });

  final bool keyboardOpen;
  final double viewportHeight;
  final bool isDark;
  final Widget card;

  static const double _estimatedBlockHeight = 518;

  @override
  Widget build(BuildContext context) {
    if (keyboardOpen) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: AppSpacing.xxs),
          AuthHeader(isDark: isDark),
          const SizedBox(height: AppSpacing.xs),
          Align(
            alignment: Alignment.topCenter,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: card,
            ),
          ),
        ],
      );
    }

    final viewPadding = MediaQuery.viewPaddingOf(context);
    final usableScreenHeight =
        MediaQuery.sizeOf(context).height - viewPadding.vertical;
    final verticalNudge = usableScreenHeight * 0.04;

    final freeSpace =
        (viewportHeight - _estimatedBlockHeight).clamp(0.0, double.infinity);
    final balancedTop = freeSpace > 0
        ? (freeSpace * 0.5 + verticalNudge * 0.5).clamp(0.0, freeSpace)
        : 0.0;
    final balancedBottom = freeSpace - balancedTop;

    final useBalancedSpacing = freeSpace >= 16;
    final topGap = useBalancedSpacing ? balancedTop : AppSpacing.xxs;
    final bottomGap = useBalancedSpacing ? balancedBottom : AppSpacing.sm;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(height: topGap),
        AuthHeader(isDark: isDark),
        const SizedBox(height: AppSpacing.xs),
        Align(
          alignment: Alignment.topCenter,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: card,
          ),
        ),
        SizedBox(height: bottomGap),
      ],
    );
  }
}
