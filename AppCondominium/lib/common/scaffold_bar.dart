import 'package:flutter/material.dart';
import 'package:sagaz_condominium/common/nome_app_text.dart';

Widget scaffoldBar(Key key, Widget child,
    {String? title, bool resizeToAvoidBottomInset = false}) {
  final gradient = LinearGradient(
    colors: [
      Colors.amber.shade400,
      Colors.amber.shade900,
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  bool hasTitle = (title != null && title.isNotEmpty);
  return Scaffold(
    key: key,
    resizeToAvoidBottomInset: resizeToAvoidBottomInset,
    appBar: AppBar(
      title: Row(
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          Container(
            height: 50,
            width: 50,
            decoration: const BoxDecoration(
                color: Colors.white, shape: BoxShape.circle),
            child: Container(
              margin: const EdgeInsets.all(2),
              decoration:
                  BoxDecoration(gradient: gradient, shape: BoxShape.circle),
              child: Image.asset(
                'assets/images/png/logo.png',
              ),
            ),
          ),
          const SizedBox(
            width: 20,
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              nomeAppText(hasTitle ? 22.0 : 40, appColor: Colors.white),
              if (hasTitle) ...[Text(title)],
            ],
          )
        ],
      ),
    ),
    body: GestureDetector(
        onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
        child: child),
  );
}
