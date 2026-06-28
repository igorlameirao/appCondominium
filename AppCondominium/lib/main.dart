import 'package:flutter/material.dart';
import 'package:sagaz_condominium/common/preferencial_tema.dart';
import 'package:sagaz_condominium/paginas/login/nao_registrado/registrar_usuario.dart';
import 'package:sagaz_condominium/paginas/pagina_inicial.dart';
import 'package:sagaz_condominium/paginas/principal/pagina_principal.dart';
import 'package:sagaz_condominium/services/token_service.dart';
import 'package:sagaz_condominium/data/view_models/usuario_logado.dart';

final navigatorKey = GlobalKey<NavigatorState>();
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await TokenService.create();
  await UsuarioLogado.carregar();
  runApp(const App());
}

class App extends StatefulWidget {
  const App({Key? key}) : super(key: key);
  @override
  State<App> createState() => _AppState();
}

class _AppState extends State<App> with WidgetsBindingObserver {
  @override
  void initState() {
    WidgetsBinding.instance.addObserver(this);
    PreferencialTema.setTema();
    super.initState();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangePlatformBrightness() {
    PreferencialTema.setTema();
    super.didChangePlatformBrightness();
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder(
      valueListenable: PreferencialTema.tema,
      builder: (BuildContext context, Brightness tema, _) => MaterialApp(
          title: 'Condominium',
          navigatorKey: navigatorKey,
          theme: ThemeData(
            primarySwatch: Colors.blue,
            brightness: tema,
          ),
          initialRoute: UsuarioLogado.logado ? PaginaPrincipal.routName : '/',
          routes: {
            '/': (context) => const PaginaInicial(),
            RegistrarUsuario.routName: (context) => const RegistrarUsuario(),
            PaginaPrincipal.routName: (context) => const PaginaPrincipal(),
          }),
    );
  }
}
