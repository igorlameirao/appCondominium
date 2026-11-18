import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../auth/application/auth_session_notifier.dart';
import '../../home/presentation/theme/home_layout.dart';
import '../../home/presentation/theme/home_surface.dart';
import '../../home/presentation/widgets/home_background.dart';
import '../../units/application/selected_unit_notifier.dart';
import '../data/conta_repository.dart';
import '../data/perfil_conta_models.dart';

class AccountSettingsPage extends ConsumerStatefulWidget {
  const AccountSettingsPage({super.key});

  @override
  ConsumerState<AccountSettingsPage> createState() =>
      _AccountSettingsPageState();
}

class _AccountSettingsPageState extends ConsumerState<AccountSettingsPage> {
  var _carregando = true;
  String? _erroPerfil;
  PerfilConta? _perfil;
  Uint8List? _foto;

  @override
  void initState() {
    super.initState();
    _carregarPerfil();
  }

  Future<void> _carregarPerfil() async {
    setState(() {
      _carregando = true;
      _erroPerfil = null;
    });
    try {
      final repo = ref.read(contaRepositoryProvider);
      final perfil = await repo.obterPerfil();
      Uint8List? foto;
      if (perfil.temFoto) {
        foto = await repo.baixarFotoPerfil();
      }
      if (!mounted) return;
      setState(() {
        _perfil = perfil;
        _foto = foto;
        _carregando = false;
      });
    } catch (_) {
      if (!mounted) return;
      final auth = ref.read(authSessionProvider);
      setState(() {
        _perfil = PerfilConta(
          nome: auth.nome ?? 'Usuário',
          perfil: auth.perfil ?? '',
          temFoto: false,
        );
        _carregando = false;
        _erroPerfil = 'Não foi possível atualizar os dados do perfil.';
      });
    }
  }

  BoxDecoration _softAccentDecoration(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return BoxDecoration(
      color: isDark
          ? AppColors.blueDeep.withValues(alpha: 0.35)
          : AppColors.bluePrimary.withValues(alpha: 0.07),
      borderRadius: BorderRadius.circular(HomeSurface.minimalRadius),
      border: Border.all(
        color: isDark
            ? Colors.white.withValues(alpha: 0.06)
            : AppColors.bluePrimary.withValues(alpha: 0.12),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authSessionProvider);
    final unit = ref.watch(selectedUnitProvider);
    final perfil = _perfil;
    final accent = HomeSurface.iconAccent(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final nomeExibicao = perfil?.nome ?? auth.nome ?? '—';
    final perfilLabel = (perfil?.perfil ?? auth.perfil ?? '').trim();
    final email =
        (perfil?.email ?? '').trim().isNotEmpty ? perfil!.email!.trim() : '—';
    final condominio =
        auth.condominioNome ?? 'Condomínio ${auth.idCondominio ?? '—'}';
    final unidade = unit.displayLabel;

    final overlayStyle = HomeSurface.systemUiOverlayStyle(context);
    final pageBackground = HomeSurface.pageBackground(context);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: overlayStyle,
      child: Scaffold(
        backgroundColor: pageBackground,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          surfaceTintColor: Colors.transparent,
          elevation: 0,
          scrolledUnderElevation: 0,
          systemOverlayStyle: overlayStyle,
          leading: IconButton(
            icon: Icon(
              Icons.arrow_back_rounded,
              color: HomeSurface.primaryText(context),
            ),
            onPressed: () => context.pop(),
          ),
          title: Text(
            'Configurações da conta',
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
            child: _carregando
                ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
                : LayoutBuilder(
                    builder: (context, constraints) {
                      final maxWidth = constraints.maxWidth > 480
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
                            constraints: BoxConstraints(maxWidth: maxWidth),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                if (_erroPerfil != null) ...[
                                  Text(
                                    _erroPerfil!,
                                    style: TextStyle(
                                      color:
                                          Theme.of(context).colorScheme.error,
                                      fontSize: 13,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(height: AppSpacing.sm),
                                ],
                                Container(
                                  padding: const EdgeInsets.fromLTRB(
                                    AppSpacing.md,
                                    AppSpacing.lg,
                                    AppSpacing.md,
                                    AppSpacing.md,
                                  ),
                                  decoration:
                                      _softAccentDecoration(context),
                                  child: Column(
                                    children: [
                                      CircleAvatar(
                                        radius: 44,
                                        backgroundColor: isDark
                                            ? AppColors.navyCard
                                            : AppColors.neutral100,
                                        foregroundImage: _foto != null
                                            ? MemoryImage(_foto!)
                                            : null,
                                        child: _foto == null
                                            ? Icon(
                                                Icons.person_rounded,
                                                color: accent,
                                                size: 44,
                                              )
                                            : null,
                                      ),
                                      const SizedBox(height: AppSpacing.sm),
                                      Text(
                                        nomeExibicao,
                                        textAlign: TextAlign.center,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: Theme.of(context)
                                            .textTheme
                                            .titleMedium
                                            ?.copyWith(
                                              color: HomeSurface.primaryText(
                                                context,
                                              ),
                                              fontWeight: FontWeight.w800,
                                            ),
                                      ),
                                      if (perfilLabel.isNotEmpty) ...[
                                        const SizedBox(height: AppSpacing.xs),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: AppSpacing.sm,
                                            vertical: 4,
                                          ),
                                          decoration: BoxDecoration(
                                            color: accent.withValues(
                                              alpha: isDark ? 0.2 : 0.12,
                                            ),
                                            borderRadius:
                                                BorderRadius.circular(20),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(
                                                Icons.verified_user_outlined,
                                                size: 14,
                                                color: accent,
                                              ),
                                              const SizedBox(width: 4),
                                              Text(
                                                perfilLabel,
                                                style: Theme.of(context)
                                                    .textTheme
                                                    .labelMedium
                                                    ?.copyWith(
                                                      color: accent,
                                                      fontWeight:
                                                          FontWeight.w600,
                                                    ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                      if (email != '—') ...[
                                        const SizedBox(height: AppSpacing.xs),
                                        Text(
                                          email,
                                          textAlign: TextAlign.center,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: Theme.of(context)
                                              .textTheme
                                              .bodySmall
                                              ?.copyWith(
                                                color: HomeSurface.secondaryText(
                                                  context,
                                                ),
                                                height: 1.35,
                                              ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                                const SizedBox(height: AppSpacing.md),
                                Container(
                                  decoration: HomeSurface.minimalCardDecoration(
                                    context,
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.stretch,
                                    children: [
                                      Padding(
                                        padding: const EdgeInsets.fromLTRB(
                                          AppSpacing.md,
                                          AppSpacing.md,
                                          AppSpacing.md,
                                          AppSpacing.xs,
                                        ),
                                        child: Row(
                                          children: [
                                            Icon(
                                              Icons.badge_outlined,
                                              size: 20,
                                              color: accent,
                                            ),
                                            const SizedBox(width: AppSpacing.xs),
                                            Text(
                                              'Dados da conta',
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .titleSmall
                                                  ?.copyWith(
                                                    color:
                                                        HomeSurface.primaryText(
                                                      context,
                                                    ),
                                                    fontWeight: FontWeight.w800,
                                                  ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      _AccountDataRow(
                                        icon: Icons.mail_outline_rounded,
                                        label: 'E-mail',
                                        value: email,
                                      ),
                                      Divider(
                                        height: 1,
                                        indent: AppSpacing.lg,
                                        endIndent: AppSpacing.md,
                                        color: HomeSurface.listDivider(context),
                                      ),
                                      _AccountDataRow(
                                        icon: Icons.apartment_rounded,
                                        label: 'Condomínio ativo',
                                        value: condominio,
                                      ),
                                      Divider(
                                        height: 1,
                                        indent: AppSpacing.lg,
                                        endIndent: AppSpacing.md,
                                        color: HomeSurface.listDivider(context),
                                      ),
                                      _AccountDataRow(
                                        icon: Icons.door_front_door_outlined,
                                        label: 'Unidade vinculada',
                                        value: unidade,
                                      ),
                                      const SizedBox(height: AppSpacing.xs),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: AppSpacing.md),
                                Container(
                                  decoration: HomeSurface.minimalCardDecoration(
                                    context,
                                  ),
                                  child: Column(
                                    children: [
                                      const _SettingsOption(
                                        icon: Icons.lock_outline_rounded,
                                        title: 'Alterar senha',
                                        subtitle:
                                            'Atualize sua senha de acesso',
                                        route: AppRoute.contaAlterarSenha,
                                      ),
                                      Divider(
                                        height: 1,
                                        indent: AppSpacing.lg,
                                        endIndent: AppSpacing.lg,
                                        color: HomeSurface.listDivider(context),
                                      ),
                                      const _SettingsOption(
                                        icon: Icons.notifications_none_rounded,
                                        title: 'Preferências de notificações',
                                        subtitle:
                                            'Push e e-mail por tipo de aviso',
                                        route: AppRoute.contaNotificacoes,
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: AppSpacing.md),
                                Container(
                                  padding: const EdgeInsets.all(AppSpacing.md),
                                  decoration:
                                      _softAccentDecoration(context),
                                  child: Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Icon(
                                        Icons.info_outline_rounded,
                                        color: accent,
                                        size: 22,
                                      ),
                                      const SizedBox(width: AppSpacing.sm),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'Dica de segurança',
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .titleSmall
                                                  ?.copyWith(
                                                    color: HomeSurface
                                                        .primaryText(context),
                                                    fontWeight: FontWeight.w800,
                                                  ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              'Mantenha seus dados atualizados e utilize uma senha forte para proteger sua conta.',
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall
                                                  ?.copyWith(
                                                    color: HomeSurface
                                                        .secondaryText(context),
                                                    height: 1.35,
                                                  ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
          ],
        ),
      ),
    );
  }
}

class _AccountDataRow extends StatelessWidget {
  const _AccountDataRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final accent = HomeSurface.iconAccent(context);

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: accent.withValues(alpha: 0.85)),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            flex: 5,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: HomeSurface.primaryText(context),
                    fontWeight: FontWeight.w500,
                  ),
            ),
          ),
          const SizedBox(width: AppSpacing.xs),
          Expanded(
            flex: 6,
            child: Text(
              value,
              textAlign: TextAlign.end,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: HomeSurface.secondaryText(context),
                    height: 1.3,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SettingsOption extends StatelessWidget {
  const _SettingsOption({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.route,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final AppRoute route;

  @override
  Widget build(BuildContext context) {
    final accent = HomeSurface.iconAccent(context);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.push(route.path),
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.sm + 2,
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: HomeSurface.shortcutIconBoxDecoration(context),
                child: Icon(icon, color: accent, size: 22),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            color: HomeSurface.primaryText(context),
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: HomeSurface.secondaryText(context),
                            height: 1.25,
                          ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right_rounded,
                color: HomeSurface.secondaryText(context),
              ),
            ],
          ),
        ),
      ),
    );
  }
}