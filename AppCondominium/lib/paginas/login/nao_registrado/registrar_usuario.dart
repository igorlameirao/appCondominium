import 'package:flutter/material.dart';
import 'package:sagaz_condominium/common/custom_button.dart';
import 'package:sagaz_condominium/paginas/login/nao_registrado/escolher_perfil.dart';
import 'package:sagaz_condominium/paginas/login/nao_registrado/informar_nome.dart';
import '../../../../common/scaffold_bar.dart';
import '../../../enums/perfil.dart';

class RegistrarUsuario extends StatefulWidget {
  static const routName = '/RegistrarUsuario';
  const RegistrarUsuario({Key? key}) : super(key: key);
  @override
  // ignore: library_private_types_in_public_api
  _RegistrarUsuarioState createState() => _RegistrarUsuarioState();
}

class _RegistrarUsuarioState extends State<RegistrarUsuario> {
  final _scaffoldKey = GlobalKey<ScaffoldState>();
  final margemPadrao =
      const EdgeInsets.only(left: 30, right: 30, top: 10, bottom: 10);
  late List<Widget> pages = [];
  int pageIndex = 0;
  final controllerPage = PageController(initialPage: 0);
  String _email = '';
  Perfil? _perfilEscolhido;
  DateTime? _dataNascimento;
  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is String) {
      _email = args;
    }
    pages = _montarCaminho();

    return scaffoldBar(
      _scaffoldKey,
      title: 'Cadastrando Usuário',
      resizeToAvoidBottomInset: true,
      GestureDetector(
        onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
        child: Container(
          decoration:
              BoxDecoration(color: Theme.of(context).scaffoldBackgroundColor),
          height: MediaQuery.of(context).size.height * 0.88,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
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
                padding: margemPadrao,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    customButton(
                      context,
                      "Anterior",
                      prefixIcon: Icons.navigate_before,
                      size: const Size(120, 40),
                      onPressed: pages.isEmpty || pageIndex == 0
                          ? null
                          : () {
                              FocusScope.of(context).unfocus();
                              _anterior();
                            },
                    ),
                    const SizedBox(
                      width: 20,
                    ),
                    customButton(
                      context,
                      "Próximo",
                      suffixIcon: Icons.navigate_next,
                      size: const Size(120, 40),
                      onPressed: pages.isEmpty || pageIndex == pages.length - 1
                          ? null
                          : () {
                              FocusScope.of(context).unfocus();
                              _proximo();
                            },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _montarCaminho() {
    return [
      InformarNome(
        2,
        3,
        email: _email,
        dataNascimentoInicial: _dataNascimento,
        onDataNascimentoChanged: (value) => _dataNascimento = value,
      ),
      EscolherPerfil(
        email: _email,
        perfilInicial: _perfilEscolhido,
        onPerfilChanged: (value) => _perfilEscolhido = value,
      ),
      Container(color: Colors.blue)
    ];
  }

  void _proximo() {
    controllerPage.nextPage(
        duration: const Duration(milliseconds: 500), curve: Curves.easeInOut);
  }

  void _anterior() {
    controllerPage.previousPage(
        duration: const Duration(milliseconds: 500), curve: Curves.easeInOut);
  }
}
