import '../data/mappers/user_mapper.dart';
import '../services/user_preferences_service.dart';
import '../data/entities/api_user.dart';
import '../data/repo/user_repository.dart';
import '../services/token_service.dart';
import '../data/viewModels/user.dart';
import '../data/repo/api_client.dart';

class UserService {
  static final UserService _singleton = UserService._internal();

  factory UserService() {
    return _singleton;
  }

  //default constructor
  UserService._internal();

  final _userRepository = UserRepository();
  User _loggedInUser;
  User get loggedInUser => _loggedInUser;

  Future<User> getLoggedInUser() async {
    if (_loggedInUser == null) {
      final apiUser = await _userRepository.getUser();
      _loggedInUser = apiUser.toViewModel();
    }

    return _loggedInUser;
  }

  Future<void> registrationRequest(String email) async {
    await _userRepository.registrationRequest(email);
  }

  Future<void> changePassword(
      String userId, String oldPassword, String newPassword) async {
    await _userRepository.changePassword(userId, oldPassword, newPassword);
  }

  Future<User> register(
    String email,
    String password,
    String emailValidationToken, {
    String firstName,
    String lastName,
  }) async {
    final user = await _userRepository.createUser(
      email,
      password,
      emailValidationToken,
      firstName: firstName,
      lastName: lastName,
    );
    final vmUser = user.toViewModel();
    return vmUser;
  }

  Future<SignInReturn> logIn(String email, String password,
      {bool rememberMe = true}) async {
    SignInReturn returnValue;
    try {
      final loggedIn = await _userRepository.logIn(email, password, rememberMe);

      final tokenManager = TokenService();
      await tokenManager.setUserToken(loggedIn.token);
      await tokenManager.setUserRefreshToken(loggedIn.refreshToken);

      final preferences = await UserPreferencesService().getUserPreferences();

      final userData = loggedIn.user;
      _loggedInUser = User(
        id: userData.id,
        email: userData.emailAddress,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isBetaTester: userData.isBetaTester,
        preferences: preferences,
      );

      returnValue = SignInReturn.success;
    } on ApiException catch (e) {
      switch (e.statusCode) {
        case 401: //Unauthorized
          // ***** Migration process *****
          // Check if the user have a Firebase User.
          final mService = MigrationService();
          final hasFirebaseUser =
              await mService.userHasFirebaseUser(email, password);
          if (hasFirebaseUser) {
            // Case positive, initiate the migration process
            returnValue = SignInReturn.migrate;
          } else {
            // Case not, return a Failed log in message
            returnValue = SignInReturn.unauthorized;
          }
          break;
        default:
          // As default, prevent user to Log in;
          returnValue = SignInReturn.unauthorized;
      }
    } catch (e) {
      throw e;
    }
    return returnValue;
  }

  Future<bool> updateUser(User user) async {
    final bdUser = ApiUser().fromViewModel(user);
    await _userRepository.updateUser(bdUser);
    await UserPreferencesService().saveUserAllowPresetSharing(
      user.preferences.allowPresetSharing,
    );

    return true;
  }

  Future<void> logOut() async {
    final tokenManager = TokenService();
    await tokenManager.setUserToken(null);
    await tokenManager.setUserRefreshToken(null);
    _loggedInUser = null;
  }

  Future<void> forgotPassword(String email) async {
    await _userRepository.forgotPassword(email);
  }

  Future<void> resetPassword(
      String email, String token, String password) async {
    await _userRepository.resetPassword(email, token, password);
  }

  Future<void> deleteAccount(String password) async {
    await _userRepository.deleteAccount(
      _loggedInUser.id,
      _loggedInUser.email,
      password,
    );
  }
}

enum SignInReturn { success, unauthorized, migrate }
