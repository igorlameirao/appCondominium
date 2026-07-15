import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:shared_preferences/shared_preferences.dart';

class TokenService {
  static TokenService? _singleton;
  late SharedPreferences _pref;

  //default constructor
  TokenService._internal();

  static Future<TokenService> create() async {
    if (_singleton == null) {
      _singleton = TokenService._internal();
      _singleton = await _singleton!._initialize();
    }
    return _singleton!;
  }

  Future<TokenService> _initialize() async {
    _pref = await SharedPreferences.getInstance();
    return this;
  }

  factory TokenService() {
    return _singleton!;
  }

  Future<void> setApplicationToken(String token) async {
    await _pref.setString("ApplicationToken", token);
  }

  String getApplicationToken() {
    final token = _pref.getString("ApplicationToken");
    if (token?.isEmpty ?? true) throw Exception("Application Token is empty.");
    return token ?? '';
  }

  Future<void> setUserToken(String token) async {
    await _pref.setString("UserToken", token);
  }

  String getUserToken() {
    final token = _pref.getString("UserToken");
    return token ?? "NO-TOKEN";
  }

  Future<bool> isUserLoggedIn() async {
    final userToken = getUserToken();

    if (!isTokenValid(userToken)) {
      await setUserToken('');
      return false;
    }

    return true;
  }

  Future<void> setUserRefreshToken(String refreshToken) async {
    await _pref.setString("UserRefreshToken", refreshToken);
  }

  String getUserRefreshToken() {
    final token = _pref.getString("UserRefreshToken");
    if (token?.isEmpty ?? true) throw Exception("User Refresh Token is empty.");
    return token ?? '';
  }

  Future<void> clearUserRefreshToken() async {
    await _pref.setString('UserToken', '');
    await _pref.setString('UserRefreshToken', '');
  }

  bool isTokenValid(String token) {
    try {
      return (token.isEmpty) ? false : !JwtDecoder.isExpired(token);
    } catch (e) {
      return false;
    }
  }
}
