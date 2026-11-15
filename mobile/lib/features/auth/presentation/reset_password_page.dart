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

class ResetPasswordPage extends ConsumerStatefulWidget {
  const ResetPasswordPage({super.key, required this.token});

  final String token;

  @override
  ConsumerState<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends ConsumerState<ResetPasswordPage> {
  final _senhaController = TextEditingController();
  final _confirmarController = TextEditingController();
  var _obscureSenha = true;
  var _obscureConfirmar = true;
  var _carregando = true;
  var _linkValido = false;
  var _salvando = false;
  var _concluido = false;
  String? _erro;
  String? _mensagemOk;

  @override
  void initState() {
    super.initState();
    _validar();
  }

  @override
  void dispose() {
    _senhaController.dispose();
    _confirmarController.dispose();
    super.dispose();
  }

  Future<void> _validar() async {
    if (widget.token.isEmpty) {
      setState(() {
        _carregando = false;
        _linkValido = false;
        _erro = 'Link inválido ou expirado.';
      });
      return;
    }
    try {
      final ok = await ref
          .read(passwordRecoveryRepositoryProvider)
          .validarToken(widget.token);
      if (!mounted) return;
      setState(() {
        _linkValido = ok;
        _erro = ok ? null : 'Link inválido ou expirado.';
        _carregando = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _linkValido = false;
        _erro = 'Link inválido ou expirado.';
        _carregando = false;
      });
    }
  }

  Future<void> _salvar() async {
    final senha = _senhaController.text;
    final confirmar = _confirmarController.text;
    if (senha.length < 8) {
      setState(() => _erro = 'A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (senha != confirmar) {
      setState(() => _erro = 'As senhas não conferem.');
      return;
    }
    setState(() {
      _salvando = true;
      _erro = null;
    });
    try {
      final msg = await ref.read(passwordRecoveryRepositoryProvider).redefinir(
            token: widget.token,
            senhaNova: senha,
            senhaConfirmacao: confirmar,
          );
      if (!mounted) return;
      setState(() {
        _mensagemOk = msg;
        _concluido = true;
        _salvando = false;
      });
    } on DioException catch (e) {
      if (!mounted) return;
      final data = e.response?.data;
      final apiMsg = data is Map ? data['mensagem']?.toString() : null;
      setState(() {
        _erro = apiMsg ?? 'Não foi possível redefinir a senha.';
        _salvando = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _erro = 'Não foi possível redefinir a senha.';
        _salvando = false;
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
                      if (_carregando)
                        const Padding(
                          padding: EdgeInsets.all(AppSpacing.md),
                          child: Center(child: CircularProgressIndicator()),
                        )
                      else ...[
                        AuthHeader(isDark: isDark),
                        const SizedBox(height: AppSpacing.xxs + 1),
                        Text(
                          _concluido ? 'Senha redefinida' : 'Redefinir senha',
                          style:
                              AppTypography.welcomeTitle(context, isDark: isDark),
                        ),
                        const SizedBox(height: AppSpacing.xxs),
                        Text(
                          _concluido
                              ? 'Faça login com sua nova senha'
                              : _linkValido
                                  ? 'Mínimo de 8 caracteres'
                                  : 'Link indisponível',
                          style: AppTypography.welcomeSubtitle(
                            context,
                            isDark: isDark,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.sm + 2),
                        if (_concluido) ...[
                          if (_mensagemOk != null)
                            Text(
                              _mensagemOk!,
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark
                                    ? AppColors.textMutedDark
                                    : AppColors.textMutedLight,
                              ),
                            ),
                          const SizedBox(height: AppSpacing.sm),
                          AuthGradientButton(
                            label: 'Ir para o login',
                            onPressed: () => context.go('/login'),
                          ),
                        ] else if (!_linkValido) ...[
                          if (_erro != null)
                            Text(
                              _erro!,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.statusDanger,
                              ),
                            ),
                          const SizedBox(height: AppSpacing.sm),
                          TextButton(
                            onPressed: () =>
                                context.go('/recuperacao-senha/esqueci'),
                            child: const Text('Solicitar novo link'),
                          ),
                        ] else ...[
                          AuthTextField(
                            hint: 'Nova senha',
                            isDark: isDark,
                            obscureText: _obscureSenha,
                            controller: _senhaController,
                            textInputAction: TextInputAction.next,
                            suffix: IconButton(
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(
                                minWidth: 36,
                                minHeight: 36,
                              ),
                              onPressed: () =>
                                  setState(() => _obscureSenha = !_obscureSenha),
                              icon: Icon(
                                _obscureSenha
                                    ? Icons.visibility_outlined
                                    : Icons.visibility_off_outlined,
                                size: 18,
                              ),
                            ),
                          ),
                          const SizedBox(height: AppSpacing.xs + 2),
                          AuthTextField(
                            hint: 'Confirmar senha',
                            isDark: isDark,
                            obscureText: _obscureConfirmar,
                            controller: _confirmarController,
                            textInputAction: TextInputAction.done,
                            suffix: IconButton(
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(
                                minWidth: 36,
                                minHeight: 36,
                              ),
                              onPressed: () => setState(
                                () => _obscureConfirmar = !_obscureConfirmar,
                              ),
                              icon: Icon(
                                _obscureConfirmar
                                    ? Icons.visibility_outlined
                                    : Icons.visibility_off_outlined,
                                size: 18,
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
                          AbsorbPointer(
                            absorbing: _salvando,
                            child: Opacity(
                              opacity: _salvando ? 0.72 : 1,
                              child: AuthGradientButton(
                                label:
                                    _salvando ? 'Salvando...' : 'Redefinir senha',
                                onPressed: _salvar,
                              ),
                            ),
                          ),
                        ],
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