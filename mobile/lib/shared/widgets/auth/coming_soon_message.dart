import 'package:flutter/material.dart';

void showComingSoonMessage(BuildContext context) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(
      const SnackBar(
        content: Text('Funcionalidade disponível em breve'),
        duration: Duration(seconds: 2),
      ),
    );
}
