import 'package:flutter/material.dart';

Widget linhaCampo(String label, Widget campo,
    {double? labelFontSize = 16,
    Color? labelFontColor,
    bool labelFontBold = true,
    Color? labelBackgroundColor,
    String? labelFontFamily}) {
  TextStyle style = TextStyle(
      fontSize: labelFontSize,
      color: labelFontColor,
      fontWeight: labelFontBold ? FontWeight.bold : FontWeight.normal,
      backgroundColor: labelBackgroundColor,
      fontFamily: labelFontFamily);
  return Row(
    children: [Text(label, style: style), campo],
  );
}
