import 'package:flutter/material.dart';

class HomePlaceholderPage extends StatelessWidget {
  const HomePlaceholderPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Início')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'Área reservada para o shell autenticado, menus dinâmicos '
            'e troca de condomínio.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
