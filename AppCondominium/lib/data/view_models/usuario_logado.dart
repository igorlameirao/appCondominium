import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// RT-Gerais 12 (Regra de Ouro): sessão com IdCondominio global.
class UsuarioLogado {
  static String email = '';
  static String nome = '';
  static int? idCondominio;
  static String perfil = '';
  static bool acessoTotal = false;
  static List<String> permissoes = [];

  static const _keyEmail = 'email';
  static const _keyNome = 'nome';
  static const _keyIdCondominio = 'idCondominio';
  static const _keyPerfil = 'perfil';
  static const _keyAcessoTotal = 'acessoTotal';
  static const _keyPermissoes = 'permissoes';

  static Future<void> carregar() async {
    final prefs = await SharedPreferences.getInstance();
    email = prefs.getString(_keyEmail) ?? '';
    nome = prefs.getString(_keyNome) ?? '';
    idCondominio = prefs.getInt(_keyIdCondominio);
    perfil = prefs.getString(_keyPerfil) ?? '';
    acessoTotal = prefs.getBool(_keyAcessoTotal) ?? false;
    permissoes = _lerLista(prefs.getString(_keyPermissoes));
  }

  static Future<void> salvar({
    required String emailUsuario,
    required String nomeUsuario,
    required int idCondominioSelecionado,
    required String perfilUsuario,
    bool acessoTotalUsuario = false,
    List<String> permissoesUsuario = const [],
  }) async {
    email = emailUsuario;
    nome = nomeUsuario;
    idCondominio = idCondominioSelecionado;
    perfil = perfilUsuario;
    acessoTotal = acessoTotalUsuario;
    permissoes = List<String>.from(permissoesUsuario);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyEmail, email);
    await prefs.setString(_keyNome, nome);
    await prefs.setInt(_keyIdCondominio, idCondominioSelecionado);
    await prefs.setString(_keyPerfil, perfil);
    await prefs.setBool(_keyAcessoTotal, acessoTotal);
    await prefs.setString(_keyPermissoes, json.encode(permissoes));
  }

  static bool pode(String permissionKey, String acao) {
    if (acessoTotal) return true;
    return permissoes.contains('$permissionKey:$acao');
  }

  static List<String> _lerLista(String? raw) {
    if (raw == null || raw.isEmpty) return [];
    final decoded = json.decode(raw);
    if (decoded is! List) return [];
    return decoded.map((e) => e.toString()).toList();
  }

  static Future<void> limpar() async {
    email = '';
    nome = '';
    idCondominio = null;
    perfil = '';
    acessoTotal = false;
    permissoes = [];
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyEmail);
    await prefs.remove(_keyNome);
    await prefs.remove(_keyIdCondominio);
    await prefs.remove(_keyPerfil);
    await prefs.remove(_keyAcessoTotal);
    await prefs.remove(_keyPermissoes);
  }

  static bool get logado => idCondominio != null && email.isNotEmpty;
}
