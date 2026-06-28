import 'package:flutter/material.dart';

Widget label(String label,
    {EdgeInsets? margin,
    AlignmentGeometry? alignment,
    EdgeInsetsGeometry? padding,
    double? labelFontSize = 16,
    Color? labelFontColor,
    bool labelFontBold = false,
    Color? labelBackgroundColor,
    String? labelFontFamily}) {
  TextStyle style = TextStyle(
      fontSize: labelFontSize,
      color: labelFontColor,
      fontWeight: labelFontBold ? FontWeight.bold : FontWeight.normal,
      backgroundColor: labelBackgroundColor,
      fontFamily: labelFontFamily);
  return Container(
      margin: margin,
      alignment: alignment ?? AlignmentDirectional.topStart,
      padding: padding,
      child: Text(label, style: style));
}
