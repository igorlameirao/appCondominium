import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class PreferencialTema {
  static ValueNotifier<Brightness> tema = ValueNotifier(Brightness.light);
  static bool isDark = (tema.value == Brightness.dark);
  static setTema() {
    tema.value = WidgetsBinding.instance.platformDispatcher.platformBrightness;
    changeStatusNavigationBar();
  }

  static changeStatusNavigationBar() {
    isDark = (tema.value == Brightness.dark);
    SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle(
      statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
      statusBarBrightness: isDark ? Brightness.light : Brightness.dark,
      statusBarColor: isDark ? Colors.blue.shade900 : Colors.blue.shade700,
      systemNavigationBarIconBrightness:
          isDark ? Brightness.light : Brightness.dark,
      systemNavigationBarColor:
          isDark ? Colors.grey.shade900 : Colors.blue.shade300,
    ));
  }
}
