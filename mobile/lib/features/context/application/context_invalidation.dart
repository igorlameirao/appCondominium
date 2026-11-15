import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../units/application/selected_unit_notifier.dart';

void invalidateTenantScopedCaches(WidgetRef ref) {
  ref.read(selectedUnitProvider.notifier).resetForTenantChange();
}

void invalidateTenantScopedCachesFromRef(Ref ref) {
  ref.read(selectedUnitProvider.notifier).resetForTenantChange();
}