import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../shared/widgets/auth/auth_selectable_tile.dart';
import '../../auth/application/auth_session_notifier.dart';
import '../../auth/data/models/auth_dtos.dart';
import '../../auth/domain/login_destino.dart';
import '../../units/application/selected_unit_notifier.dart';
import '../application/tenant_context_actions.dart';

Future<void> showTrocarCondominioSheet(BuildContext context, WidgetRef ref) async {
  late final List<CondominioVinculoDto> vinculos;
  try {
    vinculos = await ref.read(vinculosAtivosProvider.future);
  } catch (_) {
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Não foi possível carregar seus condomínios. Tente novamente.',
        ),
      ),
    );
    return;
  }
  if (!context.mounted) return;
  if (vinculos.length <= 1) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Você está vinculado apenas a este condomínio.'),
      ),
    );
    return;
  }
  final atual = ref.read(authSessionProvider).idCondominio;

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (ctx) => _CondominioSwitchSheet(
      vinculos: vinculos,
      idCondominioAtual: atual,
    ),
  );
}

Future<void> showTrocarPerfilSheet(BuildContext context, WidgetRef ref) async {
  final vinculos = await ref.read(vinculosAtivosProvider.future);
  final idCondominio = ref.read(authSessionProvider).idCondominio;
  if (idCondominio == null || !context.mounted) return;

  final condo = vinculos
      .map((e) => e.toDomain())
      .where((v) => v.idCondominio == idCondominio)
      .toList();
  if (condo.isEmpty) return;
  final perfis = condo.first.perfis;
  if (perfis.length <= 1) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Há apenas um perfil neste condomínio.')),
    );
    return;
  }

  await showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    builder: (ctx) => _PerfilSwitchSheet(perfis: perfis),
  );
}

Future<void> showTrocarUnidadeSheet(BuildContext context, WidgetRef ref) async {
  final unidades = await ref.read(minhasUnidadesProvider.future);
  if (!context.mounted) return;
  if (unidades.isEmpty) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Nenhuma unidade vinculada neste condomínio.'),
      ),
    );
    return;
  }
  if (unidades.length == 1) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Unidade atual: ${unidades.first.descricao}')),
    );
    return;
  }

  await showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    builder: (ctx) => _UnidadeSwitchSheet(unidades: unidades),
  );
}

class _CondominioSwitchSheet extends ConsumerStatefulWidget {
  const _CondominioSwitchSheet({
    required this.vinculos,
    required this.idCondominioAtual,
  });

  final List<CondominioVinculoDto> vinculos;
  final int? idCondominioAtual;

  @override
  ConsumerState<_CondominioSwitchSheet> createState() =>
      _CondominioSwitchSheetState();
}

class _CondominioSwitchSheetState extends ConsumerState<_CondominioSwitchSheet> {
  var _loading = false;
  String? _error;

  Future<void> _onSelect(CondominioVinculo condo) async {
    if (_loading || condo.idCondominio == widget.idCondominioAtual) {
      Navigator.of(context).pop();
      return;
    }

    final domain = condo;
    final destino = destinoAposCondominio(domain);

    if (destino is DestinoSelecionarPerfil) {
      Navigator.of(context).pop();
      if (!mounted) return;
      await _openPerfilParaCondominio(condo);
      return;
    }

    if (destino is! DestinoAutenticar) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    final err = await ref.read(tenantContextActionsProvider).trocarCondominio(
          idCondominio: destino.idCondominio,
          idPerfil: destino.idPerfil,
          condominioNome: condo.nome,
        );

    if (!mounted) return;
    if (err != null) {
      setState(() {
        _loading = false;
        _error = err;
      });
      return;
    }
    Navigator.of(context).pop();
  }

  Future<void> _openPerfilParaCondominio(CondominioVinculo condo) async {
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => _PerfilSwitchSheet(
        perfis: condo.perfis,
        idCondominio: condo.idCondominio,
        condominioNome: condo.nome,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final vinculos = widget.vinculos.map((e) => e.toDomain()).toList();

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.lg,
          0,
          AppSpacing.lg,
          AppSpacing.lg,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Trocar condomínio',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: AppSpacing.sm),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                child: Text(
                  _error!,
                  style: const TextStyle(
                    color: AppColors.statusDanger,
                    fontSize: 12,
                  ),
                ),
              ),
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: vinculos.length,
                separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.xs),
                itemBuilder: (context, index) {
                  final v = vinculos[index];
                  return AuthSelectableTile(
                    title: v.nome,
                    selected: v.idCondominio == widget.idCondominioAtual,
                    enabled: !_loading,
                    onTap: () => _onSelect(v),
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

class _PerfilSwitchSheet extends ConsumerStatefulWidget {
  const _PerfilSwitchSheet({
    required this.perfis,
    this.idCondominio,
    this.condominioNome,
  });

  final List<PerfilVinculo> perfis;
  final int? idCondominio;
  final String? condominioNome;

  @override
  ConsumerState<_PerfilSwitchSheet> createState() => _PerfilSwitchSheetState();
}

class _PerfilSwitchSheetState extends ConsumerState<_PerfilSwitchSheet> {
  var _loading = false;
  String? _error;

  Future<void> _onPerfil(PerfilVinculo perfil) async {
    if (_loading) return;
    setState(() {
      _loading = true;
      _error = null;
    });

    final String? err;
    if (widget.idCondominio != null) {
      err = await ref.read(tenantContextActionsProvider).trocarCondominio(
            idCondominio: widget.idCondominio!,
            idPerfil: perfil.idPerfil,
            condominioNome: widget.condominioNome,
          );
    } else {
      err = await ref.read(tenantContextActionsProvider).trocarPerfil(
            idPerfil: perfil.idPerfil,
          );
    }

    if (!mounted) return;
    if (err != null) {
      setState(() {
        _loading = false;
        _error = err;
      });
      return;
    }
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final atual = ref.watch(authSessionProvider).perfil;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.lg,
          0,
          AppSpacing.lg,
          AppSpacing.lg,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              widget.idCondominio != null
                  ? 'Perfil no condomínio'
                  : 'Trocar perfil',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            if (widget.condominioNome != null) ...[
              const SizedBox(height: 4),
              Text(
                widget.condominioNome!,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
            const SizedBox(height: AppSpacing.sm),
            if (_error != null)
              Text(
                _error!,
                style: const TextStyle(
                  color: AppColors.statusDanger,
                  fontSize: 12,
                ),
              ),
            ...widget.perfis.map(
              (p) => Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                child: AuthSelectableTile(
                  title: p.nome,
                  selected: p.nome == atual,
                  enabled: !_loading,
                  onTap: () => _onPerfil(p),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _UnidadeSwitchSheet extends ConsumerWidget {
  const _UnidadeSwitchSheet({required this.unidades});

  final List<MinhaUnidadeDto> unidades;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = ref.watch(selectedUnitProvider).selected;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.lg,
          0,
          AppSpacing.lg,
          AppSpacing.lg,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Trocar unidade',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: AppSpacing.sm),
            ...unidades.map(
              (u) => Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                child: AuthSelectableTile(
                  title: u.descricao,
                  selected: selected?.idUnidade == u.idUnidade,
                  onTap: () async {
                    await ref.read(selectedUnitProvider.notifier).selectUnit(u);
                    if (context.mounted) Navigator.of(context).pop();
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}