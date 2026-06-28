import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:sagaz_condominium/common/custom_link_button.dart';
import 'package:sagaz_condominium/common/custom_text_field.dart';
import 'package:sagaz_condominium/common/nome_app_text.dart';
import 'package:sagaz_condominium/data/view_models/usuario_logado.dart';
import 'package:sagaz_condominium/services/auth_service.dart';
import 'package:sagaz_condominium/paginas/principal/pagina_principal.dart';

import '../common/custom_button.dart';
import '../common/preferencial_tema.dart';

class PaginaInicial extends StatefulWidget {
  const PaginaInicial({Key? key}) : super(key: key);

  @override
  // ignore: library_private_types_in_public_api
  _PaginaInicialState createState() => _PaginaInicialState();
}

class _PaginaInicialState extends State<PaginaInicial> {
  final scaffoldKey = GlobalKey<ScaffoldState>();
  final _formEmailKey = GlobalKey<FormState>();
  final _formSenhaKey = GlobalKey<FormState>();
  late bool isFormOk;
  late bool isEmailOk;
  final TextEditingController emailController = TextEditingController();
  final TextEditingController senhaController = TextEditingController();
  final TextEditingController idCondominioController = TextEditingController(text: '1');

  int pageIndex = 0;
  final controllerPage = PageController(initialPage: 0);

  @override
  void initState() {
    super.initState();
    isFormOk = false;
    isEmailOk = false;
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> pages = [_email(), _senha()];

    final gradient = LinearGradient(
      colors: [
        PreferencialTema.isDark
            ? Colors.purple.shade400
            : Colors.amber.shade400,
        PreferencialTema.isDark
            ? Colors.indigo.shade900
            : Colors.amber.shade900,
      ],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    );

    return Scaffold(
      key: scaffoldKey,
      resizeToAvoidBottomInset: true,
      body: GestureDetector(
        onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
        child: SingleChildScrollView(
          child: Container(
            height: MediaQuery.of(context).size.height,
            decoration: BoxDecoration(gradient: gradient),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.start,
              children: [
                Container(
                    margin: const EdgeInsets.only(top: 30, left: 10),
                    width: MediaQuery.of(context).size.width,
                    height: 40,
                    child: pageIndex > 0
                        ? GestureDetector(
                            onTap: () {
                              FocusScope.of(context).unfocus();
                              _anterior();
                            },
                            child: Row(children: const [
                              Icon(Icons.arrow_back),
                              Text('Voltar')
                            ]))
                        : null),
                Container(
                  margin: const EdgeInsets.only(
                      top: 30, bottom: 10, left: 100, right: 100),
                  child: Image.asset(
                    'assets/images/png/logo.png',
                  ),
                ),
                nomeAppText(60),
                const SizedBox(
                  height: 30,
                ),
                Expanded(
                  child: PageView(
                    controller: controllerPage,
                    physics: const NeverScrollableScrollPhysics(),
                    onPageChanged: (index) {
                      setState(() {
                        pageIndex = index;
                      });
                    },
                    children: pages,
                  ),
                ),
                Container(
                  alignment: AlignmentDirectional.bottomCenter,
                  child: const Text(
                    '© SAGAZ Tecnologia',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 20.0,
                        fontFamily: "Sagaz"),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _email() {
    final agora = TimeOfDay.now();
    String saudacao = "";
    if (agora.hour >= 0 && agora.hour < 5) saudacao = "Boa madrugada!";
    if (agora.hour >= 5 && agora.hour < 12) saudacao = "Bom dia!";
    if (agora.hour >= 12 && agora.hour < 18) saudacao = "Boa tarde!";
    if (agora.hour >= 18 && agora.hour <= 23) saudacao = "Boa noite!";

    return Form(
      key: _formEmailKey,
      autovalidateMode: AutovalidateMode.onUserInteraction,
      child: Column(
        children: [
          Text(saudacao, style: const TextStyle(fontSize: 24.0)),
          const Text("Vamos começar?", style: TextStyle(fontSize: 24.0)),
          Container(
            margin:
                const EdgeInsets.only(left: 20, right: 30, top: 20, bottom: 20),
            padding: const EdgeInsets.only(left: 10, right: 0),
            child: CustomTextField(
              context,
              "e-mail",
              controller: emailController,
              keyboardType: TextInputType.emailAddress,
              suffixIcon: Icons.alternate_email,
              validator: (value, pretest) {
                UsuarioLogado.email = '';
                if ((pretest == null || pretest.isEmpty) &&
                    (value != null && value.isNotEmpty)) {
                  SchedulerBinding.instance.addPostFrameCallback((_) {
                    setState(() {
                      isEmailOk = true;
                    });
                  });
                  UsuarioLogado.email = value;
                }
                return pretest;
              },
              //onFieldSubmitted: (value) => isEmailOk ? _proximo() : null,
            ),
          ),
          customButton(
            context,
            "Continuar",
            size: Size(MediaQuery.of(context).size.width - 70, 40),
            suffixIcon: Icons.navigate_next,
            onPressed: !isEmailOk
                ? null
                : () {
                    FocusScope.of(context).unfocus();
                    _proximo();
                  },
          ),
          Expanded(
            child: Container(
              alignment: AlignmentDirectional.center,
              child: customLinkButton(
                context,
                "Não é cadastrado, clique aqui!${isEmailOk ? '' : '\n(preencha o e-mail antes)'}",
                fontSize: 18,
                fontBold: true,
                onTap: UsuarioLogado.email.isEmpty
                    ? null
                    : () {
                        FocusScope.of(context).unfocus();
                        _registrarUsuario();
                      },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _senha() {
    return Form(
      key: _formSenhaKey,
      autovalidateMode: AutovalidateMode.onUserInteraction,
      child: Column(
        children: [
          const Text("Agora, só entre nós.\nInforme sua senha e condomínio:",
              style: TextStyle(fontSize: 24.0)),
          Container(
            margin: const EdgeInsets.only(left: 30, right: 30, top: 12),
            padding: const EdgeInsets.only(left: 10, right: 0),
            child: CustomTextField(
              context,
              "Id Condomínio (RT-Gerais 12)",
              controller: idCondominioController,
              keyboardType: TextInputType.number,
            ),
          ),
          Container(
            margin:
                const EdgeInsets.only(left: 30, right: 30, top: 20, bottom: 20),
            padding: const EdgeInsets.only(left: 10, right: 0),
            child: CustomTextField(
              context,
              "Senha",
              controller: senhaController,
              keyboardType: TextInputType.visiblePassword,
              onChanged: (text) => setState(() {
                isFormOk = _formSenhaKey.currentState!.validate();
              }),
              onFieldSubmitted: (value) => isFormOk ? _proximo() : null,
            ),
          ),
          Container(
            alignment: AlignmentDirectional.centerEnd,
            child: customLinkButton(
              context,
              "Esqueceu a senha?  Clique aqui!",
              fontSize: 14,
              margin: const EdgeInsets.only(top: 0, bottom: 30, right: 40),
              fontBold: true,
              onTap: () {
                FocusScope.of(context).unfocus();
                //TODO
                //_recuperarSenha();
              },
            ),
          ),
          customButton(
            context,
            "Entrar ",
            size: Size(MediaQuery.of(context).size.width - 70, 40),
            suffixIcon: Icons.login,
            onPressed: !isFormOk
                ? null
                : () {
                    FocusScope.of(context).unfocus();
                    _logar();
                  },
          ),
        ],
      ),
    );
  }

  void _proximo() {
    controllerPage.nextPage(
        duration: const Duration(milliseconds: 500), curve: Curves.easeInOut);
  }

  void _anterior() {
    controllerPage.previousPage(
        duration: const Duration(milliseconds: 500), curve: Curves.easeInOut);
  }

  Future<void> _logar() async {
    if (!_formSenhaKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Verifique o preenchimento dos campos")),
      );
      return;
    }
    final idCond = int.tryParse(idCondominioController.text.trim());
    if (idCond == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Informe o Id do condomínio")),
      );
      return;
    }
    final ok = await AuthService().login(
      usuario: emailController.text.trim(),
      senha: senhaController.text,
      idCondominio: idCond,
    );
    if (!mounted) return;
    if (ok) {
      Navigator.pushNamedAndRemoveUntil(context, PaginaPrincipal.routName, (_) => false);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Falha no login. Verifique credenciais e condomínio.")),
      );
    }
  }

  void _registrarUsuario() {
    if (!isEmailOk) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Informe o e-mail!"),
          duration: Duration(
            seconds: 5,
          ),
        ),
      );
    } else {
      Navigator.pushNamed(context, '/RegistrarUsuario');
    }
  }
}
