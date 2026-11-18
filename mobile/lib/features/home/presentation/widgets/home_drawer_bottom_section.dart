import 'package:flutter/material.dart';

import 'home_drawer_appearance_selector.dart';
import 'home_drawer_footer.dart';

class HomeDrawerBottomSection extends StatelessWidget {
  const HomeDrawerBottomSection({
    super.key,
    required this.onSignOut,
  });

  final VoidCallback onSignOut;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const HomeDrawerAppearanceSelector(),
        HomeDrawerFooter(onSignOut: onSignOut),
      ],
    );
  }
}