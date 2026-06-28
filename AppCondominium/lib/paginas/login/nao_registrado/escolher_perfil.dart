import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import '../../../data/view_models/usuario.dart';
import 'package:sagaz_condominium/common/mensagem_atencao_box.dart';
import 'package:sagaz_condominium/common/mensagem_exclamacao_linha.dart';
import '../../../common/fundo_arredondado.dart';
import '../../../enums/perfil.dart';

class EscolherPerfil extends StatefulWidget {
  const EscolherPerfil({Key? key}) : super(key: key);
  @override
  // ignore: library_private_types_in_public_api
  _EscolherPerfilState createState() => _EscolherPerfilState();
}

class _EscolherPerfilState extends State<EscolherPerfil> {
  List<Perfil?> _perfis = [];
  //late bool _isFormOk;
  Perfil? _currentOption;
  final double _itemExtent = 60;
  final double _diameterRatio = 1.1;
  final double _squeeze = 1.2;
  final margemPadrao =
      const EdgeInsets.only(left: 30, right: 30, top: 10, bottom: 10);

  final List<String> _opcoes = [];
  @override
  void initState() {
    super.initState();
    _perfis = perfis();
    _opcoes.addAll(_perfis.map((value) => value?.nome ?? '').toList());
    _currentOption = Usuario.perfil;
    //_isFormOk = false;
  }

  @override
  Widget build(BuildContext context) {
    //final email = ModalRoute.of(context)!.settings.arguments as String;
    final email = Usuario.email;

    return Column(
      mainAxisAlignment: MainAxisAlignment.start,
      children: [
        mensagemAtencaoBox("O e-mail\n$email\nnão foi encontrado.",
            margin: margemPadrao),
        Container(
          margin: margemPadrao,
          child: const Text("Vamos fazer o seu cadastro?",
              textAlign: TextAlign.center, style: TextStyle(fontSize: 24.0)),
        ),
        fundoArredondado(
          context,
          Column(
            children: [
              const Text("Informe o seu perfil:",
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 24.0)),
              Divider(color: Theme.of(context).dividerColor),
              SizedBox(
                height: MediaQuery.of(context).size.height / 4,
                child: CupertinoPicker(
                  magnification: 1.22,
                  squeeze: _squeeze,
                  diameterRatio: _diameterRatio,
                  useMagnifier: true,
                  itemExtent: _itemExtent,

                  // This sets the initial item.
                  scrollController: FixedExtentScrollController(
                    initialItem: _currentOption?.indice ?? -1,
                  ),
                  // This is called when selected item is changed.
                  onSelectedItemChanged: (int selectedItem) {
                    Perfil? opcao;
                    try {
                      opcao = _perfis.firstWhere(
                          (element) => (element?.indice ?? -1) == selectedItem);
                    } catch (e) {
                      opcao = _perfis[0];
                    }
                    if (opcao != null) {
                      setState(() {
                        _currentOption = opcao;
                      });
                      Usuario.perfil = opcao;
                    }
                  },
                  children: List<Widget>.generate(_opcoes.length, (int index) {
                    return Center(
                        child: Text(_opcoes[index],
                            style: const TextStyle(
                              fontSize: 18.0,
                            )));
                  }),
                ),
              ),
              Divider(color: Theme.of(context).dividerColor),
              mensagemExclamacaoLinha(_currentOption?.mensagem ?? ''),
            ],
          ),
          margin: margemPadrao,
        ),
      ],
    );
  }

  void submit() {}
}
