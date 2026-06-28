import 'package:flutter/material.dart';

Widget customLinkButton(BuildContext context, String texto,
    {Function? onTap,
    bool fontBold = false,
    EdgeInsetsGeometry? margin,
    double? fontSize,
    Color? forecolorEnabled,
    Color? forecolorDisabled}) {
  Color? forecolor = onTap == null
      ? forecolorDisabled ?? Theme.of(context).disabledColor
      : forecolorEnabled;

  return Container(
    margin: margin,
    child: GestureDetector(
      onTap: () => onTap?.call(),
      child: Text(
        texto,
        textAlign: TextAlign.center,
        style: TextStyle(
            fontSize: fontSize,
            color: forecolor,
            fontWeight: fontBold ? FontWeight.bold : FontWeight.normal),
      ),
    ),
  );
}
