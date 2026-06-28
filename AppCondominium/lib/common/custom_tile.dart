import 'package:flutter/material.dart';
import 'package:sagaz_condominium/common/fundo_arredondado.dart';

Widget customTile(
  BuildContext context,
  String texto,
  Widget child, {
  String routeName = '',
}) {
  return GestureDetector(
    onTap: () => Navigator.pushNamed(context, routeName),
    child: SizedBox(
      height: 100,
      width: 75,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          fundoArredondado(context, child,
              height: 60, width: 60, padding: const EdgeInsets.all(5)),
          const SizedBox(
            height: 5,
          ),
          Text(
            texto,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 12),
          )
        ],
      ),
    ),
  );
}
