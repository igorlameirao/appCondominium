import 'package:flutter/material.dart';
import 'package:sagaz_condominium/common/preferencial_tema.dart';

Widget mensagemExclamacaoLinha(String texto) {
  Color forecolor =
      PreferencialTema.isDark ? Colors.red.shade300 : Colors.red.shade600;
  return Row(
    crossAxisAlignment: CrossAxisAlignment.center,
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      Icon(
        Icons.notification_important,
        size: 30,
        color: forecolor,
      ),
      Flexible(
        fit: FlexFit.tight,
        //flex: 0,
        child: Text(
          texto,
          maxLines: 2,
          softWrap: true,
          overflow: TextOverflow.ellipsis,
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 14.0, color: forecolor),
        ),
      ),
    ],
  );
}
