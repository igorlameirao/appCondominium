import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:sagaz_condominium/common/custom_tile.dart';
import 'package:sagaz_condominium/common/fundo_arredondado.dart';
import 'package:sagaz_condominium/common/linha_campo.dart';
import 'package:sagaz_condominium/common/preferencial_tema.dart';

Widget menuPagina(BuildContext context, int numeroPg, int vencimento) {
  return Padding(
    padding: const EdgeInsets.all(10),
    child: Wrap(
      spacing: 20,
      runSpacing: 20,
      alignment: WrapAlignment.spaceAround,
      crossAxisAlignment: WrapCrossAlignment.start,
      children: _montarListaMenu(context, numeroPg, vencimento),
    ),
  );
}

const _iconSize = 40.0;
List<Widget> _montarListaMenu(
    BuildContext context, int numeroPg, int vencimento) {
  var assetColorFilter = ColorFilter.mode(
      Theme.of(context).textTheme.bodyLarge!.color ?? Colors.white,
      BlendMode.srcIn);
  List<Widget> lst = [];
  if (numeroPg < 2) {
    lst.add(_quadroAvisos(context));

    lst.add(_boletoCobranca(context, vencimento));
    // lst.add(customTile(
    //     context,
    //     "Boleto de Cobrança",
    //     SvgPicture.asset(
    //       'assets/images/svg/barcode.svg',
    //     )));
    lst.add(
      customTile(
        context,
        "Leituras Hidrômetro",
        SvgPicture.asset('assets/images/svg/water_pump.svg',
            colorFilter: assetColorFilter),
      ),
    );
    lst.add(customTile(
      context,
      "Contas do Condomínio",
      const Icon(
        Icons.pie_chart_outline,
        size: _iconSize,
      ),
    ));
    lst.add(customTile(
      context,
      "Livro de\nReclamações",
      const Icon(
        Icons.menu_book_outlined,
        size: _iconSize,
      ),
    ));
    lst.add(customTile(
      context,
      "Enviar Mensagem",
      const Icon(
        Icons.mail_outlined,
        size: _iconSize,
      ),
    ));
    lst.add(
      customTile(
        context,
        "Cadastrar Veículos",
        SvgPicture.asset('assets/images/svg/transportation.svg',
            colorFilter: assetColorFilter),
      ),
    );

    lst.add(customTile(
        context,
        "Cadastrar Visitante",
        const Icon(
          Icons.person_3_outlined,
          size: _iconSize,
        )));

    lst.add(customTile(
      context,
      "prestador de Serviços",
      const Icon(
        Icons.engineering_outlined,
        size: _iconSize,
      ),
    ));
    lst.add(customTile(
        context,
        "Tipos de Unidade",
        const Icon(
          Icons.home_work_outlined,
          size: _iconSize,
        )));

    lst.add(customTile(
        context,
        "Cadastrar Bloco",
        const Icon(
          Icons.apartment_outlined,
          size: _iconSize,
        )));

    lst.add(customTile(
        context,
        "Cadastrar Unidade",
        const Icon(
          Icons.house_outlined,
          size: _iconSize,
        )));

    lst.add(customTile(
      context,
      "Assembléia",
      const Icon(
        Icons.campaign_outlined,
        size: _iconSize,
      ),
    ));

    lst.add(customTile(
      context,
      "Votar",
      const Icon(
        Icons.how_to_vote_outlined,
        size: _iconSize,
      ),
    ));
  } else {
    lst.add(customTile(
      context,
      "Licitação",
      const Icon(
        Icons.gavel_outlined,
        size: _iconSize,
      ),
    ));

    lst.add(customTile(
      context,
      "Equipamento",
      const Icon(
        Icons.storefront_outlined,
        size: _iconSize,
      ),
    ));

    lst.add(customTile(
      context,
      "Rateio de Despesas",
      const Icon(
        Icons.payments,
        size: _iconSize,
      ),
    ));

    lst.add(customTile(
      context,
      "Banco",
      const Icon(
        Icons.account_balance_outlined,
        size: _iconSize,
      ),
    ));

    lst.add(customTile(
      context,
      "Despesas",
      const Icon(
        Icons.shopping_cart_outlined,
        size: _iconSize,
      ),
    ));
  }
  return lst;
}

Widget _quadroAvisos(BuildContext context) {
  return fundoArredondado(
      context,
      Column(
        children: const [
          Text(
            "Quadro de Avisos",
            style: TextStyle(fontWeight: FontWeight.bold),
          )
        ],
      ),
      width: MediaQuery.of(context).size.width - 40,
      padding: const EdgeInsets.all(2),
      height: 100,
      backgoundColor: Colors.red.shade100.withAlpha(128),
      borderColor: Colors.red.shade900);
}

Widget _boletoCobranca(BuildContext context, int vencimento) {
  Color vencimentoColor =
      PreferencialTema.isDark ? Colors.black : Colors.red.shade900;

  return fundoArredondado(
      context,
      Column(
        children: [
          const Text(
            "Boleto de Cobrança",
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(
            height: 2,
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.only(left: 5),
                alignment: AlignmentDirectional.topStart,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    linhaCampo('Em atraso: ', const Text('0')),
                    linhaCampo(
                      'Valor do Último: ',
                      const Text('R\$999,99'),
                    ),
                    linhaCampo(
                      'Vencimento: ',
                      const Text('99/12/9099'),
                    ),
                    linhaCampo(
                      'Situação: ',
                      const Text('Pago'),
                    ),
                  ],
                ),
              ),
              fundoArredondado(
                  context,
                  Column(
                    children: [
                      Text(
                        'Vence todo dia',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 12, color: vencimentoColor),
                      ),
                      Text(
                        '$vencimento',
                        style: TextStyle(
                            fontSize: 32,
                            fontFamily: 'Abril Fatface',
                            color: vencimentoColor),
                      ),
                    ],
                  ),
                  margin: const EdgeInsets.all(5),
                  padding: const EdgeInsets.all(5))
            ],
          )
        ],
      ),
      width: MediaQuery.of(context).size.width - 40,
      padding: const EdgeInsets.all(2),
      //height: 100,
      backgoundColor: Colors.amber.shade100.withAlpha(128),
      borderColor: Colors.brown);
}
