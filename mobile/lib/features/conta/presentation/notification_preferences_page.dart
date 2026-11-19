import 'dart:math' as math;

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../shared/widgets/auth/auth_gradient_button.dart';
import '../../home/presentation/theme/home_layout.dart';
import '../../home/presentation/theme/home_surface.dart';
import '../../home/presentation/widgets/home_background.dart';
import '../data/conta_repository.dart';
import '../data/preferencia_notificacao_models.dart';

class NotificationPreferencesPage extends ConsumerStatefulWidget {
  const NotificationPreferencesPage({super.key});

  @override
  ConsumerState<NotificationPreferencesPage> createState() =>
      _NotificationPreferencesPageState();
}

class _NotificationPreferencesPageState
    extends ConsumerState<NotificationPreferencesPage> {
  var _carregando = true;
  var _salvando = false;
  var _alterado = false;
  var _sucesso = false;
  String? _erro;

  List<PreferenciaNotificacaoCategoria> _categorias = [];

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    setState(() {
      _carregando = true;
      _erro = null;
      _sucesso = false;
    });
    try {
      final lista =
          await ref.read(contaRepositoryProvider).listarPreferenciasNotificacao();
      if (!mounted) return;
      setState(() {
        _categorias = lista.categorias.map((c) => c.copiar()).toList();
        _carregando = false;
        _alterado = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _carregando = false;
        _erro = 'Não foi possível carregar as preferências.';
      });
    }
  }

  Future<void> _salvar() async {
    if (!_alterado) return;
    setState(() {
      _salvando = true;
      _erro = null;
      _sucesso = false;
    });
    try {
      final lista = await ref
          .read(contaRepositoryProvider)
          .salvarPreferenciasNotificacao(_categorias);
      if (!mounted) return;
      setState(() {
        _categorias = lista.categorias.map((c) => c.copiar()).toList();
        _salvando = false;
        _alterado = false;
        _sucesso = true;
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
        _erro = 'Não foi possível salvar as preferências.';
      });
    }
  }

  String _mapDioError(DioException e) {
    final data = e.response?.data;
    if (data is String && data.isNotEmpty) return data;
    return 'Não foi possível salvar as preferências.';
  }

  void _alternarPush(PreferenciaNotificacaoCategoria item, bool valor) {
    setState(() {
      item.ativoPush = valor;
      _alterado = true;
      _sucesso = false;
    });
  }

  void _alternarEmail(PreferenciaNotificacaoCategoria item, bool valor) {
    setState(() {
      item.ativoEmail = valor;
      _alterado = true;
      _sucesso = false;
    });
  }

  Map<String, List<PreferenciaNotificacaoCategoria>> _agruparPorModulo() {
    final mapa = <String, List<PreferenciaNotificacaoCategoria>>{};
    for (final cat in _categorias) {
      mapa.putIfAbsent(cat.modulo, () => []).add(cat);
    }
    for (final lista in mapa.values) {
      lista.sort((a, b) => a.ordem.compareTo(b.ordem));
    }
    return mapa;
  }

  List<MapEntry<String, List<PreferenciaNotificacaoCategoria>>>
      _modulosOrdenados(Map<String, List<PreferenciaNotificacaoCategoria>> grupos) {
  return grupos.entries.toList()
      ..sort((a, b) {
        final oa = a.value.map((e) => e.ordem).reduce(math.min);
        final ob = b.value.map((e) => e.ordem).reduce(math.min);
        return oa.compareTo(ob);
      });
  }

  BoxDecoration _painelSuaveDecoration(BuildContext context) {
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

  static IconData _iconeModulo(String modulo) {
    final chave = modulo.toLowerCase();
    if (chave.contains('encomenda')) {
      return Icons.inventory_2_outlined;
    }
    return Icons.layers_outlined;
  }

  static IconData _iconeEvento(String codigoTipo) {
    switch (codigoTipo) {
      case 'ENCOMENDA_RECEBIDA':
        return Icons.inventory_2_outlined;
      case 'ENCOMENDA_RETIRADA':
        return Icons.move_to_inbox_outlined;
      default:
        return Icons.notifications_none_rounded;
    }
  }

  static String? _subtituloEvento(String codigoTipo) {
    switch (codigoTipo) {
      case 'ENCOMENDA_RECEBIDA':
        return 'Aviso quando uma encomenda for registrada.';
      case 'ENCOMENDA_RETIRADA':
        return 'Aviso quando uma encomenda for retirada.';
      default:
        return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final modulos = _modulosOrdenados(_agruparPorModulo());

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
          onPressed: _salvando ? null : () => context.pop(),
        ),
        title: Text(
          'Preferências de notificações',
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
                          alignment: Alignment.topCenter,
                          child: ConstrainedBox(
                            constraints: BoxConstraints(maxWidth: maxFormWidth),
                            child: Container(
                              padding: const EdgeInsets.all(AppSpacing.md),
                              decoration:
                                  HomeSurface.minimalCardDecoration(context),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        width: 44,
                                        height: 44,
                                        alignment: Alignment.center,
                                        decoration:
                                            HomeSurface.shortcutIconBoxDecoration(
                                          context,
                                        ),
                                        child: Icon(
                                          Icons.notifications_none_rounded,
                                          size: 24,
                                          color: HomeSurface.iconAccent(context),
                                        ),
                                      ),
                                      const SizedBox(width: AppSpacing.sm),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'Preferências de notificações',
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .titleSmall
                                                  ?.copyWith(
                                                    color:
                                                        HomeSurface.primaryText(
                                                      context,
                                                    ),
                                                    fontWeight: FontWeight.w800,
                                                    height: 1.25,
                                                  ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              'Escolha como deseja receber cada tipo de aviso.',
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall
                                                  ?.copyWith(
                                                    color:
                                                        HomeSurface.secondaryText(
                                                      context,
                                                    ),
                                                    height: 1.35,
                                                  ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (_erro != null) ...[
                                    const SizedBox(height: AppSpacing.sm),
                                    _FeedbackBanner(
                                      success: false,
                                      message: _erro!,
                                      isDark: isDark,
                                    ),
                                  ],
                                  if (_sucesso) ...[
                                    const SizedBox(height: AppSpacing.sm),
                                    _FeedbackBanner(
                                      success: true,
                                      message: 'Preferências salvas.',
                                      isDark: isDark,
                                    ),
                                  ],
                                  const SizedBox(height: AppSpacing.md),
                                  for (var m = 0; m < modulos.length; m++) ...[
                                    _ModuloSecao(
                                      modulo: modulos[m].key,
                                      itens: modulos[m].value,
                                      desabilitado: _salvando,
                                      iconeModulo: _iconeModulo(modulos[m].key),
                                      painelDecoration:
                                          _painelSuaveDecoration(context),
                                      onPush: _alternarPush,
                                      onEmail: _alternarEmail,
                                    ),
                                    if (m < modulos.length - 1)
                                      const SizedBox(height: AppSpacing.sm),
                                  ],
                                  const SizedBox(height: AppSpacing.sm),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: AppSpacing.sm,
                                      vertical: AppSpacing.xs + 2,
                                    ),
                                    decoration:
                                        _painelSuaveDecoration(context),
                                    child: Row(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Icon(
                                          Icons.info_outline_rounded,
                                          size: 18,
                                          color: HomeSurface.iconAccent(context),
                                        ),
                                        const SizedBox(width: AppSpacing.xs),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                'Sobre os avisos',
                                                style: Theme.of(context)
                                                    .textTheme
                                                    .labelMedium
                                                    ?.copyWith(
                                                      color: HomeSurface
                                                          .primaryText(context),
                                                      fontWeight: FontWeight.w600,
                                                      height: 1.25,
                                                    ),
                                              ),
                                              const SizedBox(height: 2),
                                              Text(
                                                'Para receber avisos no aplicativo, você precisa ter o AppCondominium instalado no celular, estar conectado à sua conta e permitir as notificações.',
                                                style: Theme.of(context)
                                                    .textTheme
                                                    .bodySmall
                                                    ?.copyWith(
                                                      color: HomeSurface
                                                          .secondaryText(
                                                        context,
                                                      ),
                                                      height: 1.35,
                                                    ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: AppSpacing.sm),
                                  Opacity(
                                    opacity:
                                        _alterado && !_salvando ? 1 : 0.48,
                                    child: AbsorbPointer(
                                      absorbing: !_alterado || _salvando,
                                      child: AuthGradientButton(
                                        compact: true,
                                        label: _salvando
                                            ? 'Salvando...'
                                            : 'Salvar preferências',
                                        icon: _salvando
                                            ? null
                                            : Icons.check_rounded,
                                        onPressed: _salvar,
                                      ),
                                    ),
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
      ),
    );
  }
}

class _ModuloSecao extends StatelessWidget {
  const _ModuloSecao({
    required this.modulo,
    required this.itens,
    required this.desabilitado,
    required this.iconeModulo,
    required this.painelDecoration,
    required this.onPush,
    required this.onEmail,
  });

  final String modulo;
  final List<PreferenciaNotificacaoCategoria> itens;
  final bool desabilitado;
  final IconData iconeModulo;
  final BoxDecoration painelDecoration;
  final void Function(PreferenciaNotificacaoCategoria item, bool valor) onPush;
  final void Function(PreferenciaNotificacaoCategoria item, bool valor) onEmail;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.sm,
            vertical: AppSpacing.xs,
          ),
          decoration: painelDecoration,
          child: Row(
            children: [
              Icon(
                iconeModulo,
                size: 18,
                color: HomeSurface.iconAccent(context),
              ),
              const SizedBox(width: AppSpacing.xs),
              Text(
                modulo,
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: HomeSurface.primaryText(context),
                      fontWeight: FontWeight.w700,
                    ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        for (var i = 0; i < itens.length; i++) ...[
          _CategoriaTile(
            item: itens[i],
            desabilitado: desabilitado || itens[i].obrigatoria,
            icone: _NotificationPreferencesPageState._iconeEvento(
              itens[i].codigoTipo,
            ),
            subtitulo: _NotificationPreferencesPageState._subtituloEvento(
              itens[i].codigoTipo,
            ),
            onPush: itens[i].pushDisponivel
                ? (v) => onPush(itens[i], v)
                : null,
            onEmail: itens[i].emailDisponivel
                ? (v) => onEmail(itens[i], v)
                : null,
          ),
          if (i < itens.length - 1)
            Divider(
              height: 1,
              thickness: 1,
              color: HomeSurface.listDivider(context),
            ),
        ],
      ],
    );
  }
}

class _CategoriaTile extends StatelessWidget {
  const _CategoriaTile({
    required this.item,
    required this.desabilitado,
    required this.icone,
    required this.subtitulo,
    required this.onPush,
    required this.onEmail,
  });

  final PreferenciaNotificacaoCategoria item;
  final bool desabilitado;
  final IconData icone;
  final String? subtitulo;
  final ValueChanged<bool>? onPush;
  final ValueChanged<bool>? onEmail;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                icone,
                size: 20,
                color: HomeSurface.iconAccent(context),
              ),
              const SizedBox(width: AppSpacing.xs),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            item.descricao,
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                  fontWeight: FontWeight.w700,
                                  color: HomeSurface.primaryText(context),
                                  height: 1.25,
                                ),
                          ),
                        ),
                        if (item.obrigatoria)
                          Container(
                            margin: const EdgeInsets.only(left: AppSpacing.xs),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: Theme.of(context)
                                  .colorScheme
                                  .surfaceContainerHighest,
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              'Obrigatória',
                              style: Theme.of(context)
                                  .textTheme
                                  .labelSmall
                                  ?.copyWith(fontWeight: FontWeight.w600),
                            ),
                          ),
                      ],
                    ),
                    if (subtitulo != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        subtitulo!,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: HomeSurface.secondaryText(context),
                              height: 1.35,
                            ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          if (onPush != null || onEmail != null) ...[
            const SizedBox(height: AppSpacing.xs),
            LayoutBuilder(
              builder: (context, constraints) {
                final empilhar = constraints.maxWidth < 300;
                final switchApp = onPush != null
                    ? _CanalSwitch(
                        icone: Icons.smartphone_outlined,
                        label: 'No aplicativo',
                        hint: null,
                        semanticsLabel: 'No aplicativo — ${item.descricao}',
                        value: item.ativoPush,
                        enabled: !desabilitado,
                        onChanged: onPush!,
                      )
                    : null;
                final switchEmail = onEmail != null
                    ? _CanalSwitch(
                        icone: Icons.mail_outline_rounded,
                        label: 'E-mail',
                        hint: '(no seu e-mail)',
                        semanticsLabel: 'E-mail — ${item.descricao}',
                        value: item.ativoEmail,
                        enabled: !desabilitado,
                        onChanged: onEmail!,
                      )
                    : null;

                if (empilhar) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (switchApp != null) switchApp,
                      if (switchApp != null && switchEmail != null)
                        const SizedBox(height: AppSpacing.xs),
                      if (switchEmail != null) switchEmail,
                    ],
                  );
                }
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (switchApp != null) Expanded(child: switchApp),
                    if (switchApp != null && switchEmail != null)
                      const SizedBox(width: AppSpacing.xs),
                    if (switchEmail != null) Expanded(child: switchEmail),
                  ],
                );
              },
            ),
          ],
        ],
      ),
    );
  }
}

class _CanalSwitch extends StatelessWidget {
  const _CanalSwitch({
    required this.icone,
    required this.label,
    required this.semanticsLabel,
    required this.value,
    required this.enabled,
    required this.onChanged,
    this.hint,
  });

  final IconData icone;
  final String label;
  final String? hint;
  final String semanticsLabel;
  final bool value;
  final bool enabled;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textoSecundario = hint;
    return Semantics(
      label: semanticsLabel,
      toggled: value,
      enabled: enabled,
      child: Material(
        color: isDark
            ? Colors.white.withValues(alpha: 0.06)
            : AppColors.neutral100.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(8, 6, 4, 6),
          child: Row(
            children: [
              Icon(
                icone,
                size: 16,
                color: HomeSurface.secondaryText(context),
                semanticLabel: label,
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      label,
                      style: Theme.of(context).textTheme.labelMedium?.copyWith(
                            color: HomeSurface.primaryText(context),
                            fontWeight: FontWeight.w600,
                            height: 1.15,
                          ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (textoSecundario != null) ...[
                      Text(
                        textoSecundario,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: HomeSurface.secondaryText(context),
                              fontSize: 10,
                              height: 1.1,
                            ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
              ExcludeSemantics(
                child: Transform.scale(
                  scale: 0.82,
                  child: Switch.adaptive(
                    value: value,
                    onChanged: enabled ? onChanged : null,
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ),
              ),
            ],
          ),
        ),
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
    final fg = success ? AppColors.statusSuccess : AppColors.statusDanger;
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