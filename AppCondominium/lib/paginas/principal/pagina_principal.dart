import 'dart:math';

import 'package:flutter/material.dart';
import 'package:sagaz_condominium/common/preferencial_tema.dart';
import '../../../../../common/scaffold_bar.dart';
import 'menu_pagina.dart';

class PaginaPrincipal extends StatefulWidget {
  static const routName = '/PaginaPrincipal';
  const PaginaPrincipal({Key? key}) : super(key: key);
  @override
  // ignore: library_private_types_in_public_api
  _PaginaPrincipalState createState() => _PaginaPrincipalState();
}

class _PaginaPrincipalState extends State<PaginaPrincipal> {
  final _scaffoldKey = GlobalKey<ScaffoldState>();
  final margemPadrao =
      const EdgeInsets.only(left: 30, right: 30, top: 10, bottom: 10);
  late List<Widget> pages = [];
  int pageIndex = 0;
  final controllerPage = PageController(initialPage: 0);
  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    pages = _montarCaminho();

    return scaffoldBar(
      _scaffoldKey,
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
                  physics: const ScrollPhysics(),
                  onPageChanged: (index) {
                    setState(() {
                      pageIndex = index;
                    });
                  },
                  children: pages,
                ),
              ),
              if (pages.length > 1) ...[_montarBarraBolas(pages.length)],
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _montarCaminho() {
    return [
      menuPagina(context, 1, 99),
      menuPagina(context, 2, 99),
    ];
  }

  Color _enfraquecerCor(Color cor, {int fatorEnfraquecimento = 50}) {
    int r = min(cor.red + fatorEnfraquecimento, 255);
    int g = min(cor.green + fatorEnfraquecimento, 255);
    int b = min(cor.blue + fatorEnfraquecimento, 255);
    return Color.fromARGB(255, r, g, b);
  }

  Widget _montarBarraBolas(int qtdPaginas) {
    Color backgroundColor = Theme.of(context).scaffoldBackgroundColor;
    Color corBolaSelecionada = PreferencialTema.isDark
        ? Theme.of(context).secondaryHeaderColor
        : Theme.of(context).primaryColor;
    Color corBolaNaoSelecionada = _enfraquecerCor(corBolaSelecionada);
    Color corBolaSombra = Theme.of(context).shadowColor;
    List<Widget> lst = [];
    for (int cont = 0; cont < qtdPaginas; cont++) {
      lst.add(
        GestureDetector(
          onTap: () => controllerPage.animateToPage(cont,
              duration: const Duration(milliseconds: 500),
              curve: Curves.easeInOut),
          child: Container(
            color: backgroundColor,
            padding:
                const EdgeInsets.only(top: 15, bottom: 10, left: 10, right: 10),
            child: Container(
              height: 20,
              width: 20,
              decoration: BoxDecoration(
                color: pageIndex == cont
                    ? corBolaSelecionada
                    : corBolaNaoSelecionada,
                shape: BoxShape.circle,
                border: pageIndex == cont
                    ? Border.all(color: corBolaNaoSelecionada, width: 2)
                    : null,
                boxShadow: pageIndex == cont
                    ? null
                    : [
                        BoxShadow(
                          color: corBolaSombra.withOpacity(0.3),
                          spreadRadius: 1,
                          blurRadius: 1,
                          offset:
                              const Offset(4, 4), // changes position of shadow
                        ),
                      ],
              ),
            ),
          ),
        ),
      );
    }
    return Container(
      color: backgroundColor,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: lst,
      ),
    );
  }
}
