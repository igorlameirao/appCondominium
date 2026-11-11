import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:sagaz_condominium/data/view_models/usuario_logado.dart';
import 'package:sagaz_condominium/services/token_service.dart';

class AuthService {
  final String baseUrl;

  AuthService({String? baseUrl})
      : baseUrl = baseUrl ??
            const String.fromEnvironment(
              'API_BASE_URL',
              defaultValue: 'http://localhost:5000/api/',
            );

  Future<bool> login({
    required String usuario,
    required String senha,
    required int idCondominio,
  }) async {
    final uri = Uri.parse('${baseUrl}auth/login');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'usuario': usuario,
        'senha': senha,
        'idCondominio': idCondominio,
      }),
    );
    if (response.statusCode != 200) return false;
    final body = json.decode(response.body) as Map<String, dynamic>;
    await TokenService().setUserToken(body['token'] as String);
    await UsuarioLogado.salvar(
      emailUsuario: usuario,
      nomeUsuario: body['nome'] as String? ?? usuario,
      idCondominioSelecionado: body['idCondominio'] as int,
      perfilUsuario: body['perfil'] as String? ?? '',
      acessoTotalUsuario: body['acessoTotal'] == true,
      permissoesUsuario: _permissoes(body['permissoes']),
    );
    return true;
  }

  Future<bool> trocarCondominio(int idCondominio) async {
    final token = TokenService().getUserToken();
    final uri = Uri.parse('${baseUrl}auth/trocar-condominio');
    final response = await http.post(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
        'X-Id-Condominio': '${UsuarioLogado.idCondominio}',
      },
      body: json.encode({'idCondominio': idCondominio}),
    );
    if (response.statusCode != 200) return false;
    final body = json.decode(response.body) as Map<String, dynamic>;
    await TokenService().setUserToken(body['token'] as String);
    await UsuarioLogado.salvar(
      emailUsuario: UsuarioLogado.email,
      nomeUsuario: body['nome'] as String? ?? UsuarioLogado.nome,
      idCondominioSelecionado: body['idCondominio'] as int,
      perfilUsuario: body['perfil'] as String? ?? UsuarioLogado.perfil,
      acessoTotalUsuario: body['acessoTotal'] == true,
      permissoesUsuario: _permissoes(body['permissoes']),
    );
    return true;
  }

  Future<List<Map<String, dynamic>>> listarCondominios(String q, {String? usuario}) async {
    if (q.length < 3) return [];
    final params = <String, String>{'q': q};
    if (usuario != null && usuario.isNotEmpty) params['usuario'] = usuario;
    final uri = Uri.parse('${baseUrl}auth/condominios').replace(queryParameters: params);
    final response = await http.get(uri);
    if (response.statusCode != 200) return [];
    final list = json.decode(response.body) as List<dynamic>;
    return list.cast<Map<String, dynamic>>();
  }

  List<String> _permissoes(dynamic raw) {
    if (raw is! List) return [];
    return raw.map((e) => e.toString()).toList();
  }
}
