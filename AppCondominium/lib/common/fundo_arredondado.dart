import 'package:flutter/material.dart';

Widget fundoArredondado(
  BuildContext context,
  Widget child, {
  bool useShadow = false,
  EdgeInsets? margin,
  double? height,
  double? width,
  EdgeInsetsGeometry padding = const EdgeInsets.all(10),
  Color? borderColor,
  Color? backgoundColor,
}) {
  Color backgroundcolor = backgoundColor ?? Theme.of(context).splashColor;
  Color bordercolor = borderColor ?? Theme.of(context).dividerColor;
  return Container(
      height: height,
      width: width,
      margin: margin,
      padding: padding,
      decoration: BoxDecoration(
        color: backgroundcolor,
        borderRadius: const BorderRadius.all(Radius.circular(15)),
        border: Border.all(color: bordercolor),
        boxShadow: !useShadow
            ? null
            : [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.5),
                  spreadRadius: 2,
                  blurRadius: 5,
                  offset: const Offset(0, 3), // changes position of shadow
                ),
              ],
      ),
      child: child);
}
