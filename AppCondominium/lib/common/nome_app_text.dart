import 'package:flutter/material.dart';

Widget nomeAppText(double fontSize,
    {Color? appColor, Color? condominiumColor}) {
  appColor = appColor ?? Colors.blue.shade800;
  condominiumColor = condominiumColor ?? Colors.black;
  var textSytle = TextStyle(
      color: condominiumColor, fontSize: fontSize, fontFamily: "Sagaz");
  var textSytleSufix = textSytle.merge(TextStyle(color: appColor));
  return Row(mainAxisAlignment: MainAxisAlignment.center, children: [
    Text('app', style: textSytleSufix),
    Text('Condominium', style: textSytle)
  ]);
}
