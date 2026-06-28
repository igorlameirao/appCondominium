import 'package:shared_preferences/shared_preferences.dart';

/// RT-Gerais 12 (Regra de Ouro): sessão com IdCondominio global.
class UsuarioLogado {
  static String email = '';
  static String nome = '';
  static int? idCondominio;
  static String perfil = '';

  static const _keyEmail = 'email';
  static const _keyNome = 'nome';
  static const _keyIdCondominio = 'idCondominio';
  static const _keyPerfil = 'perfil';

  static Future<void> carregar() async {
    final prefs = await SharedPreferences.getInstance();
    email = prefs.getString(_keyEmail) ?? '';
    nome = prefs.getString(_keyNome) ?? '';
    idCondominio = prefs.getInt(_keyIdCondominio);
    perfil = prefs.getString(_keyPerfil) ?? '';
  }

  static Future<void> salvar({
    required String emailUsuario,
    required String nomeUsuario,
    required int idCondominioSelecionado,
    required String perfilUsuario,
  }) async {
    email = emailUsuario;
    nome = nomeUsuario;
    idCondominio = idCondominioSelecionado;
    perfil = perfilUsuario;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyEmail, email);
    await prefs.setString(_keyNome, nome);
    await prefs.setInt(_keyIdCondominio, idCondominioSelecionado);
    await prefs.setString(_keyPerfil, perfil);
  }

  static Future<void> limpar() async {
    email = '';
    nome = '';
    idCondominio = null;
    perfil = '';
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyEmail);
    await prefs.remove(_keyNome);
    await prefs.remove(_keyIdCondominio);
    await prefs.remove(_keyPerfil);
  }

  static bool get logado => idCondominio != null && email.isNotEmpty;
}
