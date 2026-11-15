import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../data/convite_repository.dart';

class ConviteAceitePage extends ConsumerStatefulWidget {
  const ConviteAceitePage({super.key, required this.token});

  final String token;

  @override
  ConsumerState<ConviteAceitePage> createState() => _ConviteAceitePageState();
}

class _ConviteAceitePageState extends ConsumerState<ConviteAceitePage> {
  final _nome = TextEditingController();
  final _cpf = TextEditingController();
  final _email = TextEditingController();
  final _nascimento = TextEditingController();
  final _senha = TextEditingController();
  bool _carregando = true;
  bool _salvando = false;
  ValidarConviteResult? _validacao;
  String? _mensagemOk;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    if (widget.token.isEmpty) {
      setState(() {
        _carregando = false;
        _validacao = ValidarConviteResult(
          valido: false,
          mensagem: 'Link inválido.',
          requerAutenticacao: false,
          requerDefinirSenha: false,
        );
      });
      return;
    }
    try {
      final v = await ref.read(conviteRepositoryProvider).validar(widget.token);
      setState(() {
        _validacao = v;
        _carregando = false;
      });
    } catch (_) {
      setState(() {
        _validacao = ValidarConviteResult(
          valido: false,
          mensagem: 'Convite indisponível.',
          requerAutenticacao: false,
          requerDefinirSenha: false,
        );
        _carregando = false;
      });
    }
  }

  Future<void> _ativar() async {
    setState(() => _salvando = true);
    try {
      final msg = await ref.read(conviteRepositoryProvider).aceitarContaNova(
            token: widget.token,
            nome: _nome.text.trim(),
            cpf: _cpf.text.trim(),
            email: _email.text.trim(),
            dataNascimento: _nascimento.text.trim(),
            senha: _senha.text,
            telefone: null,
          );
      setState(() {
        _mensagemOk = msg;
        _salvando = false;
      });
    } catch (e) {
      setState(() => _salvando = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Não foi possível ativar a conta.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_carregando) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final v = _validacao!;
  return Scaffold(
      appBar: AppBar(title: const Text('Aceitar convite')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (v.nomeCondominio != null)
              Text('Condomínio: ${v.nomeCondominio}',
                  style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 16),
            if (!v.valido)
              Text(v.mensagem, style: const TextStyle(color: Colors.red)),
            if (v.valido && v.requerDefinirSenha) ...[
              TextField(controller: _nome, decoration: const InputDecoration(labelText: 'Nome')),
              TextField(controller: _cpf, decoration: const InputDecoration(labelText: 'CPF')),
              TextField(controller: _email, decoration: const InputDecoration(labelText: 'E-mail')),
              TextField(
                controller: _nascimento,
                decoration: const InputDecoration(labelText: 'Nascimento (AAAA-MM-DD)'),
              ),
              TextField(
                controller: _senha,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Senha'),
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: _salvando ? null : _ativar,
                child: const Text('Ativar conta'),
              ),
            ],
            if (v.valido && v.requerAutenticacao)
              FilledButton(
                onPressed: () => context.go(AppRoute.login.path),
                child: const Text('Entrar para aceitar'),
              ),
            if (_mensagemOk != null) ...[
              const SizedBox(height: 24),
              Text(_mensagemOk!, style: const TextStyle(color: Colors.green)),
              TextButton(
                onPressed: () => context.go(AppRoute.login.path),
                child: const Text('Ir para o login'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}