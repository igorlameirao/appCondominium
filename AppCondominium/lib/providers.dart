import 'package:local_auth/local_auth.dart';
import 'package:sagaz_condominium/services/local_auth_service.dart';
import 'package:provider/provider.dart';
import 'package:provider/single_child_widget.dart';

final providers = <SingleChildWidget>[
  Provider<LocalAuthService>(
      create: (context) => LocalAuthService(
            auth: LocalAuthentication(),
          ))
];
