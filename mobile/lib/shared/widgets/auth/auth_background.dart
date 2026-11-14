import 'package:flutter/material.dart';

import '../../../core/constants/asset_paths.dart';

/// Fundo visual por tema (imagens oficiais; sem ondas desenhadas em código).
class AuthBackground extends StatelessWidget {
  const AuthBackground({super.key, required this.isDark, this.child});

  final bool isDark;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    final background = isDark
        ? const _DarkAuthBackground()
        : const _LightAuthBackground();

    if (child == null) {
      return background;
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        Positioned.fill(child: background),
        child!,
      ],
    );
  }
}

class _LightAuthBackground extends StatelessWidget {
  const _LightAuthBackground();

  @override
  Widget build(BuildContext context) {
    return const ColoredBox(
      color: Color(0xFFF4F9FC),
      child: Image(
        image: AssetImage(AssetPaths.backgroundLightWaves),
        fit: BoxFit.cover,
        alignment: Alignment(0, 1),
        filterQuality: FilterQuality.high,
      ),
    );
  }
}

class _DarkAuthBackground extends StatelessWidget {
  const _DarkAuthBackground();

  @override
  Widget build(BuildContext context) {
    return const ColoredBox(
      color: Color(0xFF061018),
      child: Image(
        image: AssetImage(AssetPaths.backgroundDarkCondominium),
        fit: BoxFit.cover,
        alignment: Alignment(0, 1),
        filterQuality: FilterQuality.high,
      ),
    );
  }
}
