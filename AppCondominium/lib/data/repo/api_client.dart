import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../helpers/util.dart';

import '../../services/token_service.dart';
import '../view_models/usuario_logado.dart';

class ApiClient {
  String _urlBase = "";
  Timer timer = Timer(
    Duration.zero,
    () {},
  );

  ApiClient() {
    _urlBase = const String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: "http://localhost:5000/api/",
    );
    devLog("Initializing BACKEND Client $_urlBase. ${this.hashCode}");
  }

  Future<dynamic> post(String targetUrl, Map params, String token) async {
    return await _postPutDelete(ActionType.post, targetUrl, params, token);
  }

  Future<dynamic> put(String targetUrl, Map params, String token) async {
    return await _postPutDelete(ActionType.put, targetUrl, params, token);
  }

  Future<dynamic> delete(String targetUrl, Map params, String token) async {
    return await _postPutDelete(ActionType.delete, targetUrl, params, token);
  }

  Future<dynamic> get(String targetUrl, String token) async {
    _ensureCredentials(token);

    http.Response response;
    String _message;

    Uri _uri = Uri.parse('$_urlBase/$targetUrl');
    response = await http.get(_uri, headers: _prepareHeader(token: token));

    dynamic dynamicBody;
    if (response?.body?.isNotEmpty ?? false) {
      dynamicBody = json.decode(response.body);
    }
    if (!(response.statusCode >= 200 && response.statusCode <= 202)) {
      _message = dynamicBody["detail"];

      throw ApiException(response.statusCode, _message, dynamicBody.toString());
    }
    return dynamicBody;
  }

  Future<dynamic> _postPutDelete(
      ActionType actionType, String targetUrl, Map params, String token) async {
    _ensureCredentials(token);

    http.Response response;

    Uri _uri = Uri.parse('$_urlBase/$targetUrl');

    final _body = json.encode(params);

    switch (actionType) {
      case ActionType.post:
        response = await http
            .post(
          _uri,
          headers: _prepareHeader(token: token),
          body: _body,
        )
            .catchError((err) {
          devLog("ERROR ON POST\n$err");
        });
        break;
      case ActionType.put:
        response = await http
            .put(
          _uri,
          headers: _prepareHeader(token: token),
          body: _body,
        )
            .catchError((err) {
          devLog("ERROR ON PUT\n$err");
        });
        break;
      case ActionType.delete:
        response = await http
            .delete(
          _uri,
          headers: _prepareHeader(token: token),
          body: _body,
        )
            .catchError((err) {
          devLog("ERROR ON DELETE\n$err");
        });
        break;
    }

    if (response == null) throw Exception("Server is unreachable.");

    if (response.statusCode == 200) {
      // 200 = OK
      return json.decode(response.body);
    } else if (response.statusCode <= 299) {
      // Other possible successful responses
      // 201 - Created
      // 204 - No content
      return response.body?.isNotEmpty ?? false
          ? json.decode(response.body)
          : null;
    } else if (response.statusCode <= 399) {
      // Redirection responses
      return null;
    } else if (response.statusCode <= 599) {
      // Client Error responses 400 to 499
      // Server Error responses 500 to 599
      var _message = "";
      try {
        final bodyContent = json.decode(response.body);
        _message = bodyContent["detail"] ?? "";
        switch (response.statusCode) {
          // exception handling for specific cases
          case (400):
            if (bodyContent['exceptionDetails'] != null) {
              final details = bodyContent['exceptionDetails'] as List;
              for (final e in details) {
                final eMap = e as Map;
                final internalMessage = eMap.entries
                    .firstWhere((element) => element.key == 'message')
                    .value;
                if (internalMessage == _message) break;
                _message += "\n";
                _message += internalMessage;
              }
            }
            break;

          case (422): // validation data error
            _message += bodyContent['title'] ?? "";
            for (final e in (bodyContent['errors'] as Map).entries) {
              _message += "\n";
              _message +=
                  "${e.key}: ${(e.value as List<dynamic>).join(",").replaceAll(".", "")};";
            }
            break;
        }
      } catch (e) {
        _message = response.body;
      }

      throw ApiException(response.statusCode, _message, response.body);
    }
  }

  Map<String, String> _prepareHeader({String token = ""}) {
    final Map<String, String> _header = {
      "Content-Type": "application/json",
    };

    if (token?.isNotEmpty ?? false) _header["Authorization"] = "Bearer $token";
    if (UsuarioLogado.idCondominio != null) {
      _header["X-Id-Condominio"] = UsuarioLogado.idCondominio.toString();
    }

    return _header;
  }

  void _ensureCredentials(String token) {
    //No need to validate tokenless calls (APP authentication)
    if (token?.isEmpty ?? true) return;

    // Check App or User token expiration, and raise an error when
    // it's not valid
    if (TokenService().isTokenValid(token)) return;

    throw Exception(
        "Suas credenciais não estão válidas. Por favor, faça o login.");
    //This is a terrible way to cause the redirecting...
    // All hail, Thor!
    // Navigator.pushAndRemoveUntil(
    //   navigatorKey.currentContext,
    //   MaterialPageRoute(
    //     builder: (context) => const PaginaInicial(),
    //   ),
    //   (route) => true,
    // );
    // ScaffoldMessenger.of(navigatorKey.currentContext).showSnackBar(
    //   SnackBar(
    //     content: Text(
    //         "Suas credenciais não estão válidas. Por favor, faça o login."),
    //   ),
    // );
  }
}

enum ActionType { post, put, delete }

class ApiException {
  final int statusCode;
  final String message;
  final String responseBody;

  ApiException(this.statusCode, this.message, this.responseBody);

  @override
  String toString() {
    return "${this.message} - ${this.responseBody}";
  }
}
