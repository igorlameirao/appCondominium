import 'package:flutter/material.dart';
import 'package:sagaz_condominium/common/preferencial_tema.dart';

Widget customButton(BuildContext context, String texto,
    {Size size = const Size(150, 40),
    Function? onPressed,
    IconData? prefixIcon,
    IconData? suffixIcon}) {
  Color forecolor = onPressed != null
      ? (PreferencialTema.isDark
          ? Theme.of(context).primaryColor
          : Theme.of(context).secondaryHeaderColor)
      : Theme.of(context).disabledColor;
  return ElevatedButton(
    onPressed: onPressed != null ? () => onPressed.call() : null,
    style: ButtonStyle(
      fixedSize: WidgetStateProperty.resolveWith<Size?>(
        (Set<WidgetState> states) {
          return size;
        },
      ),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (prefixIcon != null) ...[
          Icon(
            prefixIcon,
            color: forecolor,
            size: 30,
          )
        ],
        Text(
          texto,
          style: TextStyle(color: forecolor, fontWeight: FontWeight.bold),
        ),
        if (suffixIcon != null) ...[
          Icon(
            suffixIcon,
            color: forecolor,
            size: 30,
          )
        ]
      ],
    ),
  );
}
