import '../api_models/api_user.dart';
import '../api_models/logged_in_user.dart';
import '../mappers/user_mapper.dart';

extension LoggedInUserFromJson on LoggedInUser {
  LoggedInUser fromJson(Map<String, dynamic> json) {
    user = ApiUser().fromJson(json['user']);
    token = json['token'];
    refreshToken = json['refreshToken'];

    return this;
  }
}
