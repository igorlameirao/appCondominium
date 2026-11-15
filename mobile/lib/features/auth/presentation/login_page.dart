import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../app/theme/app_colors.dart';
import '../../../core/constants/asset_paths.dart';
import '../application/auth_session_notifier.dart';
import '../../../shared/widgets/auth/auth_selectable_tile.dart';
import 'login_controller.dart';
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

/// Tela de login — autenticação real via API (`/api/auth/vinculos` + `/api/auth/login`).
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

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _showSessionExpiredIfNeeded());
  }

  void _showSessionExpiredIfNeeded() {
    final session = ref.read(authSessionProvider);
    if (!session.sessionExpiredNotice || !mounted) return;
    ref.read(authSessionProvider.notifier).clearSessionExpiredNotice();
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        const SnackBar(
          content: Text('Sessão expirada. Faça login novamente.'),
          duration: Duration(seconds: 3),
        ),
      );
  }

  Future<void> _submitLogin() async {
    FocusScope.of(context).unfocus();
    final loginState = ref.read(loginControllerProvider);
    final controller = ref.read(loginControllerProvider.notifier);
    final success = loginState.step == LoginStep.credentials
        ? await controller.submit(
            usuarioRaw: _emailController.text,
            senha: _passwordController.text,
          )
        : false;
    if (!mounted) return;
    if (success) {
      context.go(AppRoute.home.path);
    }
  }

  Future<void> _onSelectCondominio(int id) async {
    final success =
        await ref.read(loginControllerProvider.notifier).selectCondominio(id);
    if (!mounted) return;
    if (success) context.go(AppRoute.home.path);
  }

  Future<void> _onSelectPerfil(int idPerfil) async {
    final success =
        await ref.read(loginControllerProvider.notifier).selectPerfil(idPerfil);
    if (!mounted) return;
    if (success) context.go(AppRoute.home.path);
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
    final loginState = ref.watch(loginControllerProvider);
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
                              child: _LoginStepBody(
                                loginState: loginState,
                                isDark: isDark,
                                emailController: _emailController,
                                passwordController: _passwordController,
                                obscurePassword: _obscurePassword,
                                onTogglePassword: () => setState(
                                  () => _obscurePassword = !_obscurePassword,
                                ),
                                onSubmitCredentials: _submitLogin,
                                onSelectCondominio: _onSelectCondominio,
                                onSelectPerfil: _onSelectPerfil,
                                onVoltar: () => ref
                                    .read(loginControllerProvider.notifier)
                                    .voltar(),
                                onForgotPassword: () => context.push(
                                  AppRoute.recuperacaoSenhaEsqueci.path,
                                ),
                                onGoogle: _showGoogleLoginComingSoon,
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

class _LoginStepBody extends StatelessWidget {
  const _LoginStepBody({
    required this.loginState,
    required this.isDark,
    required this.emailController,
    required this.passwordController,
    required this.obscurePassword,
    required this.onTogglePassword,
    required this.onSubmitCredentials,
    required this.onSelectCondominio,
    required this.onSelectPerfil,
    required this.onVoltar,
    required this.onForgotPassword,
    required this.onGoogle,
  });

  final LoginFormState loginState;
  final bool isDark;
  final TextEditingController emailController;
  final TextEditingController passwordController;
  final bool obscurePassword;
  final VoidCallback onTogglePassword;
  final VoidCallback onSubmitCredentials;
  final ValueChanged<int> onSelectCondominio;
  final ValueChanged<int> onSelectPerfil;
  final VoidCallback onVoltar;
  final VoidCallback onForgotPassword;
  final VoidCallback onGoogle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (loginState.step != LoginStep.credentials)
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              onPressed: loginState.isLoading ? null : onVoltar,
              icon: const Icon(Icons.arrow_back_rounded, size: 18),
              label: const Text('Voltar'),
              style: TextButton.styleFrom(
                foregroundColor: AppColors.cyanBright,
                padding: EdgeInsets.zero,
              ),
            ),
          ),
        Text(
          switch (loginState.step) {
            LoginStep.credentials => 'Bem-vindo(a)!',
            LoginStep.selectCondominio => 'Selecione o condomínio',
            LoginStep.selectPerfil => 'Selecione o perfil',
          },
          textAlign: TextAlign.start,
          style: AppTypography.welcomeTitle(context, isDark: isDark),
        ),
        const SizedBox(height: AppSpacing.xxs + 1),
        Text(
          switch (loginState.step) {
            LoginStep.credentials => 'Acesse sua conta para continuar',
            LoginStep.selectCondominio =>
              'Sua conta está vinculada a vários condomínios.',
            LoginStep.selectPerfil =>
              loginState.nomeCondominioPendente ?? 'Escolha como deseja entrar',
          },
          textAlign: TextAlign.start,
          style: AppTypography.welcomeSubtitle(context, isDark: isDark),
        ),
        const SizedBox(height: AppSpacing.sm + 2),
        if (loginState.step == LoginStep.credentials) ...[
          AuthTextField(
            hint: 'E-mail ou CPF',
            isDark: isDark,
            controller: emailController,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: AppSpacing.xs + 2),
          AuthTextField(
            hint: 'Senha',
            isDark: isDark,
            obscureText: obscurePassword,
            controller: passwordController,
            textInputAction: TextInputAction.done,
            suffix: IconButton(
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
              onPressed: onTogglePassword,
              icon: Icon(
                obscurePassword
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
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              onPressed: onForgotPassword,
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
        ],
        if (loginState.step == LoginStep.selectCondominio)
          ...loginState.vinculos.map(
            (v) => Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.xs),
              child: AuthSelectableTile(
                title: v.nome,
                enabled: !loginState.isLoading,
                onTap: () => onSelectCondominio(v.idCondominio),
              ),
            ),
          ),
        if (loginState.step == LoginStep.selectPerfil)
          ...loginState.perfisDoCondominioPendente.map(
            (p) => Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.xs),
              child: AuthSelectableTile(
                title: p.nome,
                enabled: !loginState.isLoading,
                onTap: () => onSelectPerfil(p.idPerfil),
              ),
            ),
          ),
        if (loginState.errorMessage != null) ...[
          const SizedBox(height: AppSpacing.xs),
          Text(
            loginState.errorMessage!,
            style: const TextStyle(
              color: AppColors.statusDanger,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
        if (loginState.step == LoginStep.credentials) ...[
          const SizedBox(height: AppSpacing.xxs + 2),
          AbsorbPointer(
            absorbing: loginState.isLoading,
            child: Opacity(
              opacity: loginState.isLoading ? 0.72 : 1,
              child: AuthGradientButton(
                label: loginState.isLoading ? 'Entrando...' : 'Entrar',
                icon: loginState.isLoading
                    ? null
                    : Icons.arrow_forward_rounded,
                onPressed: onSubmitCredentials,
              ),
            ),
          ),
          AuthOrDivider(isDark: isDark),
          AuthOutlineButton(
            label: 'Continuar com o Google',
            isDark: isDark,
            iconAsset: AssetPaths.googleG,
            onPressed: onGoogle,
          ),
        ],
        if (loginState.isLoading &&
            loginState.step != LoginStep.credentials) ...[
          const SizedBox(height: AppSpacing.sm),
          const Center(child: CircularProgressIndicator(strokeWidth: 2)),
        ],
      ],
    );
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
