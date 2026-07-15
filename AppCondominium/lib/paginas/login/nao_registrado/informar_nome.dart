import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:sagaz_condominium/common/linha_campo.dart';
import '../../../common/custom_text_field.dart';
import '../../../common/fundo_arredondado.dart';

class InformarNome extends StatefulWidget {
  final int passos;
  final int passo;
  final String email;
  final DateTime? dataNascimentoInicial;
  final ValueChanged<DateTime>? onDataNascimentoChanged;
  const InformarNome(this.passo, this.passos,
      {Key? key,
      required this.email,
      this.dataNascimentoInicial,
      this.onDataNascimentoChanged})
      : super(key: key);
  @override
  // ignore: library_private_types_in_public_api
  _InformarNomeState createState() => _InformarNomeState();
}

class _InformarNomeState extends State<InformarNome> {
  //late bool _isFormInfoPessoaisOk;
  final _formKeyNomes = GlobalKey<FormState>();
  final TextEditingController nomeInicioController = TextEditingController();
  final TextEditingController nomesMeioController = TextEditingController();
  final TextEditingController nomeFinalController = TextEditingController();
  String _genero = "Masculino";
  DateTime? _dataNascimento;

  final margemPadrao =
      const EdgeInsets.only(left: 30, right: 30, top: 10, bottom: 10);

  @override
  void initState() {
    super.initState();
    _dataNascimento = widget.dataNascimentoInicial;
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          fundoArredondado(
            context,
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  alignment: Alignment.center,
                  child: const Text(
                    "Identificação do Usuário:",
                    textAlign: TextAlign.center,
                    style:
                        TextStyle(fontSize: 16.0, fontWeight: FontWeight.bold),
                  ),
                ),
                Divider(color: Theme.of(context).dividerColor),
                linhaCampo(
                    "e-mail: ",
                    Text(widget.email,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 16.0)))
              ],
            ),
            margin: margemPadrao,
          ),
          // label("Etapa ${widget.passo} de ${widget.passos}",
          //     margin: const EdgeInsets.only(left: 30, top: 10, bottom: 0)),
          fundoArredondado(
            context,
            Form(
              key: _formKeyNomes,
              autovalidateMode: AutovalidateMode.onUserInteraction,
              child: Column(
                children: _form(),
              ),
            ),
            margin: margemPadrao,
          ),
        ],
      ),
    );
  }

  List<Widget> _form() {
    List<Widget> lst = [];
    lst.add(
      const Text("Informações Pessoais",
          textAlign: TextAlign.center, style: TextStyle(fontSize: 24.0)),
    );
    lst.add(Divider(color: Theme.of(context).dividerColor));
    lst.addAll(_nomes());
    lst.add(_montarDataNascimento());
    lst.add(_mudarGenero());
    return lst;
  }

  List<Widget> _nomes() {
    return [
      CustomTextField(
        context,
        "Primeiro Nome",
        margin: const EdgeInsets.only(
          left: 5,
          right: 5,
          top: 0,
        ),
        controller: nomeInicioController,
        keyboardType: TextInputType.name,
        onFieldSubmitted: (_) => FocusScope.of(context).unfocus(),
      ),
      CustomTextField(
        context,
        "Nomes do Meio",
        isMandatory: false,
        controller: nomesMeioController,
        keyboardType: TextInputType.name,
        margin: const EdgeInsets.only(
          left: 5,
          right: 5,
          top: 20,
        ),
        onFieldSubmitted: (value) => FocusScope.of(context).unfocus(),
      ),
      CustomTextField(
        context,
        "Último Nome",
        controller: nomeFinalController,
        keyboardType: TextInputType.name,
        margin: const EdgeInsets.only(
          left: 5,
          right: 5,
          top: 20,
        ),
        onFieldSubmitted: (value) => FocusScope.of(context).unfocus(),
      )
    ];
  }

  Widget _mudarGenero() {
    Color forecolor = Theme.of(context).hintColor;
    return Container(
      margin: const EdgeInsets.only(left: 5, right: 5, top: 20),
      padding: const EdgeInsets.only(left: 10, top: 5, bottom: 5, right: 10),
      decoration: BoxDecoration(
        color: (Theme.of(context).dialogTheme.backgroundColor ??
                Theme.of(context).colorScheme.surface)
            .withAlpha(128),
        borderRadius: const BorderRadius.all(Radius.circular(10)),
      ),
      child: Column(
        children: [
          Container(
            alignment: AlignmentDirectional.topStart,
            child: Text('Genero',
                style: TextStyle(color: forecolor, fontSize: 14)),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  _genero,
                ),
              ),
              const Icon(
                Icons.female,
                color: Colors.pink,
              ),
              CupertinoSwitch(
                activeTrackColor: _genero == "Masculino"
                    ? Colors.blue.withAlpha(128)
                    : Colors.pink,
                inactiveTrackColor: _genero == "Masculino"
                    ? Colors.blue.withAlpha(128)
                    : Colors.pink.withAlpha(128),
                value: _genero == "Masculino" ? true : false,
                onChanged: (value) {
                  setState(() {
                    _genero = value ? "Masculino" : "Feminino";
                  });
                },
              ),
              const Icon(
                Icons.male,
                color: Colors.blue,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _montarDataNascimento() {
    Color forecolor = Theme.of(context).hintColor;
    return Container(
      margin: const EdgeInsets.only(left: 5, right: 5, top: 20),
      padding: const EdgeInsets.only(left: 10, top: 5, bottom: 5, right: 10),
      decoration: BoxDecoration(
        color: (Theme.of(context).dialogTheme.backgroundColor ??
                Theme.of(context).colorScheme.surface)
            .withAlpha(128),
        borderRadius: const BorderRadius.all(Radius.circular(10)),
      ),
      child: Column(
        children: [
          Container(
            alignment: AlignmentDirectional.topStart,
            child: Text('Data de Nascimento',
                style: TextStyle(color: forecolor, fontSize: 14)),
          ),
          const SizedBox(
            height: 10,
          ),
          SizedBox(
            height: 60,
            child: CupertinoDatePicker(
              mode: CupertinoDatePickerMode.date,
              initialDateTime: _dataNascimento ?? DateTime.now(),
              maximumDate: DateTime.now(),
              onDateTimeChanged: (value) {
                setState(() {
                  _dataNascimento = value;
                });
                widget.onDataNascimentoChanged?.call(value);
              },
            ),
          ),
        ],
      ),
    );
  }
}
