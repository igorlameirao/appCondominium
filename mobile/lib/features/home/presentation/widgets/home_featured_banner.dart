import 'dart:async';

import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../shared/widgets/auth/coming_soon_message.dart';
import '../../domain/models/home_models.dart';
import '../theme/home_layout.dart';
import '../theme/home_surface.dart';

/// Carrossel de destaques do condomínio (assembleias, comunicados, manutenção).
class HomeFeaturedBannerCarousel extends StatefulWidget {
  const HomeFeaturedBannerCarousel({
    super.key,
    required this.highlights,
    required this.viewport,
  });

  final List<HomeFeaturedHighlight> highlights;
  final BoxConstraints viewport;

  @override
  State<HomeFeaturedBannerCarousel> createState() =>
      _HomeFeaturedBannerCarouselState();
}

class _HomeFeaturedBannerCarouselState
    extends State<HomeFeaturedBannerCarousel> {
  static const _autoAdvanceInterval = Duration(seconds: 6);
  static const _resumeAfterInteraction = Duration(seconds: 2);

  late final PageController _controller;
  Timer? _autoAdvanceTimer;
  int _index = 0;
  bool _userInteracting = false;

  List<HomeFeaturedHighlight> get _orderedHighlights {
    final copy = [...widget.highlights];
    copy.sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
    return copy;
  }

  @override
  void initState() {
    super.initState();
    _controller = PageController();
    WidgetsBinding.instance.addPostFrameCallback((_) => _scheduleAutoAdvance());
  }

  @override
  void didUpdateWidget(covariant HomeFeaturedBannerCarousel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.highlights != widget.highlights) {
      _index = _index.clamp(0, _orderedHighlights.length - 1);
    }
  }

  @override
  void dispose() {
    _autoAdvanceTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  bool get _animationsEnabled {
    return !MediaQuery.disableAnimationsOf(context);
  }

  void _scheduleAutoAdvance() {
    _autoAdvanceTimer?.cancel();
    if (!_animationsEnabled || _userInteracting || _orderedHighlights.length < 2) {
      return;
    }
    _autoAdvanceTimer = Timer(_autoAdvanceInterval, _advanceToNextPage);
  }

  void _advanceToNextPage() {
    if (!mounted || !_controller.hasClients || _orderedHighlights.isEmpty) {
      return;
    }
    final next = (_index + 1) % _orderedHighlights.length;
    _controller
        .animateToPage(
          next,
          duration: const Duration(milliseconds: 420),
          curve: Curves.easeInOut,
        )
        .whenComplete(_scheduleAutoAdvance);
  }

  void _onUserInteractionStart() {
    _userInteracting = true;
    _autoAdvanceTimer?.cancel();
  }

  void _onUserInteractionEnd() {
    _userInteracting = false;
    Future<void>.delayed(_resumeAfterInteraction, () {
      if (mounted) _scheduleAutoAdvance();
    });
  }

  @override
  Widget build(BuildContext context) {
    final highlights = _orderedHighlights;
    if (highlights.isEmpty) {
      return const SizedBox.shrink();
    }

    final bannerHeight = HomeLayout.bannerHeight(widget.viewport);
    final imageWidth = HomeLayout.bannerImageWidth(widget.viewport);
    final cardPadding = HomeLayout.bannerCardVerticalPadding(widget.viewport);

    return Column(
      children: [
        SizedBox(
          height: bannerHeight,
          child: Listener(
            onPointerDown: (_) => _onUserInteractionStart(),
            onPointerUp: (_) => _onUserInteractionEnd(),
            onPointerCancel: (_) => _onUserInteractionEnd(),
            child: PageView.builder(
              controller: _controller,
              itemCount: highlights.length,
              onPageChanged: (value) {
                setState(() => _index = value);
                _scheduleAutoAdvance();
              },
              itemBuilder: (context, index) {
                return HomeFeaturedBannerCard(
                  highlight: highlights[index],
                  imageWidth: imageWidth,
                  verticalPadding: cardPadding,
                  viewport: widget.viewport,
                );
              },
            ),
          ),
        ),
        SizedBox(height: HomeLayout.bannerDotsGap(widget.viewport)),
        _BannerDots(
          count: highlights.length,
          index: _index,
        ),
      ],
    );
  }
}

class HomeFeaturedBannerCard extends StatelessWidget {
  const HomeFeaturedBannerCard({
    super.key,
    required this.highlight,
    required this.imageWidth,
    required this.verticalPadding,
    required this.viewport,
  });

  final HomeFeaturedHighlight highlight;
  final double imageWidth;
  final double verticalPadding;
  final BoxConstraints viewport;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return DecoratedBox(
      decoration: HomeSurface.minimalCardDecoration(context),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(HomeSurface.minimalRadius),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              width: 3,
              color: AppColors.cyanBright.withValues(alpha: 0.85),
            ),
            Expanded(
              child: Padding(
                padding: EdgeInsets.fromLTRB(
                  AppSpacing.sm,
                  verticalPadding,
                  AppSpacing.xs,
                  verticalPadding,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        DecoratedBox(
                          decoration: BoxDecoration(
                            color: HomeSurface.iconAccent(context)
                                .withValues(alpha: 0.14),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 5,
                              vertical: 1,
                            ),
                            child: Text(
                              highlight.categoryLabel,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context)
                                  .textTheme
                                  .labelSmall
                                  ?.copyWith(
                                    color: HomeSurface.iconAccent(context),
                                    fontWeight: FontWeight.w800,
                                    fontSize: 9,
                                    letterSpacing: 0.1,
                                  ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            highlight.title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context)
                                .textTheme
                                .titleSmall
                                ?.copyWith(
                                  color: HomeSurface.primaryText(context),
                                  fontWeight: FontWeight.w800,
                                  fontSize: 14,
                                  height: 1.15,
                                ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(
                          _subtitleIcon(highlight.kind),
                          size: 14,
                          color: HomeSurface.secondaryText(context),
                        ),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            highlight.subtitle,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style:
                                Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: HomeSurface.secondaryText(context),
                                      fontWeight: FontWeight.w500,
                                      fontSize: 11,
                                    ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () => _onHighlightAction(context, highlight),
                        borderRadius: BorderRadius.circular(8),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                highlight.actionLabel,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: Theme.of(context)
                                    .textTheme
                                    .labelMedium
                                    ?.copyWith(
                                      color: isDark
                                          ? AppColors.cyanSoft
                                          : AppColors.bluePrimary,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 12,
                                    ),
                              ),
                              Icon(
                                Icons.arrow_forward_rounded,
                                size: 16,
                                color: isDark
                                    ? AppColors.cyanSoft
                                    : AppColors.bluePrimary,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            ClipRRect(
              borderRadius: const BorderRadius.horizontal(
                right: Radius.circular(HomeSurface.minimalRadius),
              ),
              child: SizedBox(
                width: imageWidth,
                child: _BannerSideImage(
                  highlight: highlight,
                  imageWidth: imageWidth,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  static IconData _subtitleIcon(HomeHighlightKind kind) {
    return switch (kind) {
      HomeHighlightKind.assembly => Icons.event_rounded,
      HomeHighlightKind.announcement => Icons.campaign_outlined,
      HomeHighlightKind.maintenance => Icons.build_outlined,
      HomeHighlightKind.other => Icons.star_outline_rounded,
    };
  }

  static void _onHighlightAction(
    BuildContext context,
    HomeFeaturedHighlight highlight,
  ) {
    showComingSoonMessage(context);
  }
}

class _BannerSideImage extends StatelessWidget {
  const _BannerSideImage({
    required this.highlight,
    required this.imageWidth,
  });

  final HomeFeaturedHighlight highlight;
  final double imageWidth;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (highlight.imageAssetPath != null) {
      return Image.asset(
        highlight.imageAssetPath!,
        width: double.infinity,
        height: double.infinity,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => _PlaceholderIcon(
          highlight: highlight,
          isDark: isDark,
          imageWidth: imageWidth,
        ),
      );
    }

    return _PlaceholderIcon(
      highlight: highlight,
      isDark: isDark,
      imageWidth: imageWidth,
    );
  }
}

class _PlaceholderIcon extends StatelessWidget {
  const _PlaceholderIcon({
    required this.highlight,
    required this.isDark,
    required this.imageWidth,
  });

  final HomeFeaturedHighlight highlight;
  final bool isDark;
  final double imageWidth;

  @override
  Widget build(BuildContext context) {
    final icon = HomeFeaturedBannerCard._subtitleIcon(highlight.kind);
    final accent = isDark ? AppColors.cyanSoft : AppColors.bluePrimary;
    final iconSize = (imageWidth * 0.38).clamp(34.0, 46.0);
    final halo = (imageWidth * 0.30).clamp(28.0, 38.0);

    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark
              ? [
                  AppColors.blueDeep.withValues(alpha: 0.78),
                  AppColors.navyCard.withValues(alpha: 0.88),
                ]
              : [
                  AppColors.neutral100,
                  AppColors.neutral50,
                ],
        ),
      ),
      child: Center(
        child: DecoratedBox(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: accent.withValues(alpha: isDark ? 0.16 : 0.10),
          ),
          child: Padding(
            padding: EdgeInsets.all(halo * 0.22),
            child: Icon(
              icon,
              color: accent.withValues(alpha: isDark ? 0.92 : 0.78),
              size: iconSize,
            ),
          ),
        ),
      ),
    );
  }
}

class _BannerDots extends StatelessWidget {
  const _BannerDots({required this.count, required this.index});

  final int count;
  final int index;

  @override
  Widget build(BuildContext context) {
    final active = HomeSurface.iconAccent(context);
    final inactive = HomeSurface.secondaryText(context).withValues(alpha: 0.35);

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(count, (i) {
        final selected = i == index;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          margin: const EdgeInsets.symmetric(horizontal: 3),
          width: selected ? 18 : 6,
          height: 6,
          decoration: BoxDecoration(
            color: selected ? active : inactive,
            borderRadius: BorderRadius.circular(4),
          ),
        );
      }),
    );
  }
}