import 'dart:async';
import '../mappers/loggedIn_user_mapper.dart';
import '../mappers/user_mapper.dart';
import '../api_models/logged_in_user.dart';
import '../repo/api_client.dart';
import '../../services/token_service.dart';
import '../api_models/api_user.dart';

class UsuarioRepositorio {
  static const BASE_URL = "api/User";
  ApiClient _apiClient = ApiClient();

  Future<void> registrationRequest(String email) async {
    String targetUrl = "$BASE_URL/registrationRequest/$email";

    await _apiClient.get(
      targetUrl,
      TokenService().getApplicationToken(),
    );
  }

  Future<ApiUser> createUser(
    String email,
    String password,
    String emailValidationToken,
    String firstName,
    String lastName,
  ) async {
    try {
      String targetUrl = "$BASE_URL/Register";
      Map params = {
        "email": email,
        "password": password,
        "firstName": firstName,
        "lastName": lastName,
        "token": emailValidationToken
      };

      var body = await _apiClient.post(
        targetUrl,
        params,
        TokenService().getApplicationToken(),
      );
      final user = ApiUser().fromJson(body);
      return user;
    } catch (e) {
      rethrow;
    }
  }

  Future<LoggedInUser> logIn(
      String email, String password, bool rememberMe) async {
    try {
      String targetUrl = "$BASE_URL/Login";

      Map params = {
        "email": email,
        "password": password,
        "rememberMe": rememberMe
      };

      var body = await _apiClient.post(
        targetUrl,
        params,
        TokenService().getApplicationToken(),
      );

      final loggedIn = LoggedInUser().fromJson(body);
      return loggedIn;
    } catch (e) {
      rethrow;
    }
  }

  Future<ApiUser> getUser() async {
    try {
      String targetUrl = "$BASE_URL";

      var body = await _apiClient.get(targetUrl, TokenService().getUserToken());
      final user = ApiUser().fromJson(body);

      return user;
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updateUser(ApiUser user) async {
    String targetUrl = "$BASE_URL/update";

    final body = user.toUpdateUserParameter();

    await _apiClient.put(
      targetUrl,
      body,
      TokenService().getUserToken(),
    );
  }

  Future<void> forgotPassword(String email) async {
    String targetUrl = "$BASE_URL/forgotPassword";

    Map params = {"email": email};

    await _apiClient.post(
      targetUrl,
      params,
      TokenService().getApplicationToken(),
    );
  }

  Future<void> resetPassword(
      String email, String token, String password) async {
    String targetUrl = "$BASE_URL/resetPassword";

    Map params = {
      "email": email,
      "token": token,
      "password": password,
    };

    await _apiClient.post(
      targetUrl,
      params,
      TokenService().getApplicationToken(),
    );
  }

  Future<void> deleteAccount(
      String userId, String email, String password) async {
    String targetUrl = "$BASE_URL";

    Map params = {
      "email": email,
      "password": password,
      "userId": userId,
    };

    await _apiClient.delete(
      targetUrl,
      params,
      TokenService().getUserToken(),
    );
  }

  Future<void> changePassword(
      String userId, String oldPassword, String newPassword) async {
    String targetUrl = "$BASE_URL/ChangePassword";

    Map params = {
      "userId": userId,
      "oldPassword": oldPassword,
      "newPassword": newPassword,
    };

    await _apiClient.put(
      targetUrl,
      params,
      TokenService().getUserToken(),
    );
  }
}
