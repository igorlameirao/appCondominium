import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sagaz_condominium/services/local_auth_service.dart';

import 'common/custom_button.dart';

class AuthCheck extends StatefulWidget {
  const AuthCheck({Key? key}) : super(key: key);
  @override
  State<AuthCheck> createState() => _AuthCheckState();
}

class _AuthCheckState extends State<AuthCheck> {
  final ValueNotifier<bool> isLocalAuthFailed = ValueNotifier(false);

  @override
  void initState() {
    super.initState();
    checkLocalAuth();
  }

  // @override
  // void dispose() {
  //   super.dispose();
  // }

  checkLocalAuth() async {
    final auth = context.read<LocalAuthService>();
    final isLocalAuthAvailable = await auth.isBiometricAvailable();
    isLocalAuthFailed.value = false;
    if (isLocalAuthAvailable) {
      final authenticated = await auth.authenticate();
      if (!authenticated) {
        isLocalAuthFailed.value = true;
      } else {
        if (!mounted) return;
        Navigator.of(context).pushReplacementNamed('/');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).primaryColor,
      body: ValueListenableBuilder<bool>(
        valueListenable: isLocalAuthFailed,
        builder: (context, failed, _) {
          if (failed) {
            return Center(
              child: customButton(
                context,
                'Tentar autenticar novamente',
                onPressed: checkLocalAuth(),
              ),
            );
          }
          return const Center(
            child: SizedBox(
              width: 80,
              height: 80,
              child: CircularProgressIndicator(),
            ),
          );
        },
      ),
    );
  }
}
