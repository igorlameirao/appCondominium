import 'package:appcondominium_mobile/features/home/presentation/theme/home_layout.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  BoxConstraints viewportHeight(double height) {
    return BoxConstraints(
      maxWidth: 393,
      maxHeight: height,
      minWidth: 393,
      minHeight: height,
    );
  }

  test('verticalRelaxation é contínuo entre 799 e 801 dp', () {
    final t799 = HomeLayout.verticalRelaxation(viewportHeight(799));
    final t800 = HomeLayout.verticalRelaxation(viewportHeight(800));
    final t801 = HomeLayout.verticalRelaxation(viewportHeight(801));

    expect((t801 - t799).abs(), lessThan(0.02));
    expect(t800, greaterThan(t799));
    expect(t801, greaterThan(t800));
  });

  test('gaps principais variam progressivamente com a altura', () {
    final low = HomeLayout.gapBetweenMajorSections(viewportHeight(650));
    final mid = HomeLayout.gapBetweenMajorSections(viewportHeight(763));
    final high = HomeLayout.gapBetweenMajorSections(viewportHeight(850));

    expect(low, lessThan(mid));
    expect(mid, lessThan(high));
    expect(low, greaterThanOrEqualTo(10));
    expect(high, lessThanOrEqualTo(16));
  });
}