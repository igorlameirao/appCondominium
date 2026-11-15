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
  final _emailController = TextEditingController();
  var _loading = false;
  var _concluido = false;
  String? _mensagem;
  String? _erro;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    setState(() {
      _loading = true;
      _erro = null;
      _mensagem = null;
    });
    try {
      final msg = await ref
          .read(passwordRecoveryRepositoryProvider)
          .solicitar(_emailController.text);
      if (!mounted) return;
      setState(() {
        _mensagem = msg;
        _concluido = true;
        _loading = false;
      });
    } on DioException {
      if (!mounted) return;
      setState(() {
        _erro = 'Não foi possível processar a solicitação. Tente novamente.';
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _erro = 'Não foi possível processar a solicitação. Tente novamente.';
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
                      Text(
                        'Esqueci minha senha',
                        style: AppTypography.welcomeTitle(context, isDark: isDark),
                      ),
                      const SizedBox(height: AppSpacing.xxs),
                      Text(
                        'Informe o e-mail da sua conta',
                        style: AppTypography.welcomeSubtitle(context, isDark: isDark),
                      ),
                      const SizedBox(height: AppSpacing.sm + 2),
                      AuthTextField(
                        hint: 'E-mail',
                        isDark: isDark,
                        controller: _emailController,
                        textInputAction: TextInputAction.done,
                      ),
                      if (_mensagem != null) ...[
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          _mensagem!,
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark
                                ? AppColors.textMutedDark
                                : AppColors.textMutedLight,
                          ),
                        ),
                      ],
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
                      AbsorbPointer(
                        absorbing: _loading || _concluido,
                        child: Opacity(
                          opacity: _loading || _concluido ? 0.72 : 1,
                          child: AuthGradientButton(
                            label: _loading
                                ? 'Enviando...'
                                : _concluido
                                    ? 'Enviado'
                                    : 'Enviar instruções',
                            onPressed: _submit,
                          ),
                        ),
                      ),
                      TextButton(
                        onPressed: () => context.go('/login'),
                        child: const Text('Voltar ao login'),
                      ),
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