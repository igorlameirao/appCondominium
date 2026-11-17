import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../shared/widgets/auth/auth_background.dart';
import '../../../shared/widgets/auth/auth_card.dart';
import '../../../shared/widgets/auth/auth_gradient_button.dart';
import '../../../shared/widgets/auth/auth_header.dart';
import '../../../shared/widgets/auth/auth_text_field.dart';
import '../data/password_recovery_repository.dart';

class ForgotPasswordPage extends ConsumerStatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  ConsumerState<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends ConsumerState<ForgotPasswordPage> {
  static const _mensagemGenerica =
      'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.';

  final _emailController = TextEditingController();
  var _loading = false;
  var _concluido = false;
  String? _erro;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  void _solicitarNovamente() {
    setState(() {
      _concluido = false;
      _erro = null;
    });
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    final destino = _emailController.text.trim();
    if (destino.isEmpty || _loading) return;

    setState(() {
      _loading = true;
      _erro = null;
    });
    try {
      await ref.read(passwordRecoveryRepositoryProvider).solicitar(destino);
      if (!mounted) return;
      setState(() {
        _concluido = true;
        _loading = false;
      });
    } on DioException {
      if (!mounted) return;
      setState(() {
        _erro =
            'Não foi possível processar a solicitação. Tente novamente em instantes.';
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _erro =
            'Não foi possível processar a solicitação. Tente novamente em instantes.';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: AuthBackground(
        isDark: isDark,
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            child: Center(
              child: SingleChildScrollView(
                child: AuthCard(
                  isDark: isDark,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      AuthHeader(isDark: isDark),
                      const SizedBox(height: AppSpacing.xxs + 1),
                      if (_concluido) ...[
                        _RecoverySuccessState(
                          isDark: isDark,
                          onVoltarLogin: () => context.go('/login'),
                          onSolicitarNovamente: _solicitarNovamente,
                        ),
                      ] else ...[
                        Text(
                          'Esqueci minha senha',
                          style:
                              AppTypography.welcomeTitle(context, isDark: isDark),
                        ),
                        const SizedBox(height: AppSpacing.xxs),
                        Text(
                          'Informe o e-mail da sua conta',
                          style: AppTypography.welcomeSubtitle(
                            context,
                            isDark: isDark,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.sm + 2),
                        AbsorbPointer(
                          absorbing: _loading,
                          child: Opacity(
                            opacity: _loading ? 0.85 : 1,
                            child: AuthTextField(
                              hint: 'E-mail',
                              isDark: isDark,
                              controller: _emailController,
                              keyboardType: TextInputType.emailAddress,
                              textInputAction: TextInputAction.done,
                              autofillHints: const [AutofillHints.email],
                              onSubmitted: (_) => _submit(),
                            ),
                          ),
                        ),
                        if (_erro != null) ...[
                          const SizedBox(height: AppSpacing.xs),
                          Text(
                            _erro!,
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.statusDanger,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                        const SizedBox(height: AppSpacing.sm),
                        if (_loading) ...[
                          const Center(
                            child: SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                          ),
                          const SizedBox(height: AppSpacing.sm),
                        ],
                        AbsorbPointer(
                          absorbing: _loading,
                          child: Opacity(
                            opacity: _loading ? 0.72 : 1,
                            child: AuthGradientButton(
                              label: _loading
                                  ? 'Enviando...'
                                  : 'Enviar instruções',
                              onPressed: _submit,
                            ),
                          ),
                        ),
                        TextButton(
                          onPressed: _loading ? null : () => context.go('/login'),
                          child: const Text('Voltar ao login'),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _RecoverySuccessState extends StatelessWidget {
  const _RecoverySuccessState({
    required this.isDark,
    required this.onVoltarLogin,
    required this.onSolicitarNovamente,
  });

  final bool isDark;
  final VoidCallback onVoltarLogin;
  final VoidCallback onSolicitarNovamente;

  @override
  Widget build(BuildContext context) {
    final muted =
        isDark ? AppColors.textMutedDark : AppColors.textMutedLight;
    final tipBg = isDark
        ? AppColors.fieldFillDark
        : AppColors.neutral50.withValues(alpha: 0.95);
    final tipBorder = isDark
        ? Colors.white.withValues(alpha: 0.1)
        : AppColors.neutral100;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Center(
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: AppColors.statusSuccessSurface.withValues(
                alpha: isDark ? 0.35 : 1,
              ),
              shape: BoxShape.circle,
            ),
            child: const Padding(
              padding: EdgeInsets.all(AppSpacing.sm),
              child: Icon(
                Icons.check_circle_rounded,
                color: AppColors.statusSuccess,
                size: 34,
              ),
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          'Solicitação recebida!',
          textAlign: TextAlign.center,
          style: AppTypography.welcomeTitle(context, isDark: isDark),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          _ForgotPasswordPageState._mensagemGenerica,
          textAlign: TextAlign.center,
          style: AppTypography.welcomeSubtitle(context, isDark: isDark),
        ),
        const SizedBox(height: AppSpacing.sm),
        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.sm,
            vertical: AppSpacing.xs + 2,
          ),
          decoration: BoxDecoration(
            color: tipBg,
            borderRadius: BorderRadius.circular(AppSpacing.fieldRadius),
            border: Border.all(color: tipBorder),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                Icons.mail_outline_rounded,
                size: 18,
                color: isDark ? AppColors.cyanSoft : AppColors.bluePrimary,
              ),
              const SizedBox(width: AppSpacing.xs),
              Expanded(
                child: Text(
                  'Verifique sua caixa de entrada e também a pasta de spam.',
                  style: TextStyle(
                    fontSize: 12,
                    height: 1.35,
                    color: muted,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        AuthGradientButton(
          label: 'Voltar ao login',
          onPressed: onVoltarLogin,
        ),
        TextButton(
          onPressed: onSolicitarNovamente,
          child: const Text('Não recebeu? Solicitar novamente'),
        ),
      ],
    );
  }
}