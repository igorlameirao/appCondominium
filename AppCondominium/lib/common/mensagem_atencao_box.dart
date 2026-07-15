import 'package:flutter/material.dart';

Widget mensagemAtencaoBox(String texto, {EdgeInsets? margin}) {
  Color forecolor = Colors.brown.shade600;
  Color iconColor = Colors.yellow;
  Color iconColor2 = Colors.black;
  return Container(
    margin: margin,
    padding: const EdgeInsets.all(10),
    decoration: BoxDecoration(
      color: Colors.amber.shade100,
      borderRadius: const BorderRadius.all(Radius.circular(15)),
      border: Border.all(color: forecolor),
      boxShadow: [
        BoxShadow(
          color: Colors.grey.withValues(alpha: 0.5),
          spreadRadius: 2,
          blurRadius: 5,
          offset: const Offset(3, 3), // changes position of shadow
        ),
      ],
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Stack(
          children: [
            Icon(
              Icons.warning_rounded,
              size: 60,
              color: iconColor,
            ),
            Icon(
              Icons.warning_amber_rounded,
              size: 60,
              color: iconColor2,
            )
          ],
        ),
        Text(texto,
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 20.0, color: forecolor)),
      ],
    ),
  );
}
