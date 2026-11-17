import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../home/presentation/theme/home_layout.dart';
import '../../home/presentation/theme/home_surface.dart';
import '../../home/presentation/widgets/home_background.dart';
import '../../../shared/widgets/auth/auth_gradient_button.dart';
import '../../../shared/widgets/auth/auth_text_field.dart';
import '../data/conta_repository.dart';

class ChangePasswordPage extends ConsumerStatefulWidget {
  const ChangePasswordPage({super.key});

  @override
  ConsumerState<ChangePasswordPage> createState() => _ChangePasswordPageState();
}

class _ChangePasswordPageState extends ConsumerState<ChangePasswordPage> {
  final _atualController = TextEditingController();
  final _novaController = TextEditingController();
  final _confirmaController = TextEditingController();

  var _obscureAtual = true;
  var _obscureNova = true;
  var _obscureConfirma = true;
  var _salvando = false;
  var _sucesso = false;
  String? _erro;

  @override
  void dispose() {
    _atualController.dispose();
    _novaController.dispose();
    _confirmaController.dispose();
    super.dispose();
  }

  Widget _toggleIcon(bool obscure, VoidCallback onToggle) {
    return IconButton(
      padding: EdgeInsets.zero,
      constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
      onPressed: onToggle,
      icon: Icon(
        obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
        size: 18,
        color: Theme.of(context).brightness == Brightness.dark
            ? AppColors.textMutedDark
            : AppColors.textMutedLight,
      ),
    );
  }

  Future<void> _salvar() async {
    FocusScope.of(context).unfocus();
    final atual = _atualController.text;
    final nova = _novaController.text;
    final confirma = _confirmaController.text;

    if (nova != confirma) {
      setState(() {
        _erro = 'A confirmação não coincide com a nova senha.';
        _sucesso = false;
      });
      return;
    }
    if (nova.length < 8) {
      setState(() {
        _erro = 'A nova senha deve ter pelo menos 8 caracteres.';
        _sucesso = false;
      });
      return;
    }
    if (nova == atual) {
      setState(() {
        _erro = 'A nova senha deve ser diferente da senha atual.';
        _sucesso = false;
      });
      return;
    }

    setState(() {
      _salvando = true;
      _erro = null;
      _sucesso = false;
    });

    try {
      await ref.read(contaRepositoryProvider).alterarSenha(
            senhaAtual: atual,
            senhaNova: nova,
          );
      if (!mounted) return;
      setState(() {
        _sucesso = true;
        _salvando = false;
        _atualController.clear();
        _novaController.clear();
        _confirmaController.clear();
        _obscureAtual = true;
        _obscureNova = true;
        _obscureConfirma = true;
      });
    } on DioException catch (e) {
      if (!mounted) return;
      setState(() {
        _salvando = false;
        _erro = _mapDioError(e);
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _salvando = false;
        _erro = 'Não foi possível alterar a senha.';
      });
    }
  }

  String _mapDioError(DioException e) {
    if (e.response?.statusCode == 429) {
      return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
    }
    final data = e.response?.data;
    if (data is String && data.isNotEmpty) return data;
    if (data is Map && data['mensagem'] != null) {
      return data['mensagem'].toString();
    }
    return 'Não foi possível alterar a senha.';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_rounded,
            color: HomeSurface.primaryText(context),
          ),
          onPressed: _salvando ? null : () => context.pop(),
        ),
        title: Text(
          'Alterar senha',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: HomeSurface.primaryText(context),
                fontWeight: FontWeight.w800,
              ),
        ),
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          const HomeBackground(),
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final maxFormWidth = constraints.maxWidth > 480
                    ? 420.0
                    : constraints.maxWidth;
                return SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(
                    HomeLayout.pageHorizontalPadding,
                    AppSpacing.xs,
                    HomeLayout.pageHorizontalPadding,
                    AppSpacing.lg,
                  ),
                  child: Align(
                    child: ConstrainedBox(
                      constraints: BoxConstraints(maxWidth: maxFormWidth),
                      child: Container(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        decoration: HomeSurface.minimalCardDecoration(context),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Row(
                              children: [
                                Icon(
                                  Icons.lock_outline_rounded,
                                  size: 20,
                                  color: HomeSurface.iconAccent(context),
                                ),
                                const SizedBox(width: AppSpacing.xs),
                                Expanded(
                                  child: Text(
                                    'Atualize sua senha de acesso',
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(
                                          color:
                                              HomeSurface.secondaryText(context),
                                          fontWeight: FontWeight.w500,
                                        ),
                                  ),
                                ),
                              ],
                            ),
                            if (_sucesso) ...[
                              const SizedBox(height: AppSpacing.sm),
                              _FeedbackBanner(
                                success: true,
                                message: 'Senha alterada com sucesso.',
                                isDark: isDark,
                              ),
                            ],
                            if (_erro != null) ...[
                              const SizedBox(height: AppSpacing.sm),
                              _FeedbackBanner(
                                success: false,
                                message: _erro!,
                                isDark: isDark,
                              ),
                            ],
                            const SizedBox(height: AppSpacing.sm + 2),
                            AbsorbPointer(
                              absorbing: _salvando || _sucesso,
                              child: Opacity(
                                opacity: _salvando || _sucesso ? 0.88 : 1,
                                child: Column(
                                  children: [
                                    AuthTextField(
                                      hint: 'Senha atual',
                                      isDark: isDark,
                                      obscureText: _obscureAtual,
                                      controller: _atualController,
                                      textInputAction: TextInputAction.next,
                                      autofillHints: const [
                                        AutofillHints.password,
                                      ],
                                      suffix: _toggleIcon(
                                        _obscureAtual,
                                        () => setState(
                                          () => _obscureAtual = !_obscureAtual,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: AppSpacing.xs + 2),
                                    AuthTextField(
                                      hint: 'Nova senha',
                                      isDark: isDark,
                                      obscureText: _obscureNova,
                                      controller: _novaController,
                                      textInputAction: TextInputAction.next,
                                      autofillHints: const [
                                        AutofillHints.newPassword,
                                      ],
                                      suffix: _toggleIcon(
                                        _obscureNova,
                                        () => setState(
                                          () => _obscureNova = !_obscureNova,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: AppSpacing.xs + 2),
                                    AuthTextField(
                                      hint: 'Confirmar nova senha',
                                      isDark: isDark,
                                      obscureText: _obscureConfirma,
                                      controller: _confirmaController,
                                      textInputAction: TextInputAction.done,
                                      autofillHints: const [
                                        AutofillHints.newPassword,
                                      ],
                                      onSubmitted: (_) => _salvar(),
                                      suffix: _toggleIcon(
                                        _obscureConfirma,
                                        () => setState(
                                          () => _obscureConfirma =
                                              !_obscureConfirma,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: AppSpacing.sm),
                            if (_salvando)
                              const Center(
                                child: Padding(
                                  padding:
                                      EdgeInsets.only(bottom: AppSpacing.sm),
                                  child: SizedBox(
                                    width: 22,
                                    height: 22,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  ),
                                ),
                              ),
                            if (!_sucesso)
                              AbsorbPointer(
                                absorbing: _salvando,
                                child: Opacity(
                                  opacity: _salvando ? 0.72 : 1,
                                  child: AuthGradientButton(
                                    label: _salvando
                                        ? 'Salvando...'
                                        : 'Salvar nova senha',
                                    onPressed: _salvar,
                                  ),
                                ),
                              )
                            else
                              TextButton(
                                onPressed: () => context.pop(),
                                child: const Text('Voltar'),
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
        ],
      ),
    );
  }
}

class _FeedbackBanner extends StatelessWidget {
  const _FeedbackBanner({
    required this.success,
    required this.message,
    required this.isDark,
  });

  final bool success;
  final String message;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final fg =
        success ? AppColors.statusSuccess : AppColors.statusDanger;
    final bg = success
        ? AppColors.statusSuccessSurface.withValues(alpha: isDark ? 0.35 : 1)
        : AppColors.statusDangerSurface.withValues(alpha: isDark ? 0.35 : 1);

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs + 2,
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppSpacing.fieldRadius),
        border: Border.all(color: fg.withValues(alpha: 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            success
                ? Icons.check_circle_outline_rounded
                : Icons.error_outline_rounded,
            size: 18,
            color: fg,
          ),
          const SizedBox(width: AppSpacing.xs),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                fontSize: 13,
                height: 1.35,
                color: fg,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}