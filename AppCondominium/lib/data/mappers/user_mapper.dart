import '../api_models/api_user.dart';
import '../view_models/usuario.dart' as view_model;

extension OnModelUser on ApiUser {
  view_model.Usuario? toViewModel() {
    return view_model.Usuario(id, emailAddress, firstName, middleNames, lastName,
        password, isBetaTester, []);
  }

  ApiUser fromJson(Map<String, dynamic> json) {
    id = json['id'];
    emailAddress = json['emailAddress'];
    firstName = json['firstName'];
    lastName = json['lastName'];
    isBetaTester = json['isBetaTester'] ?? false;
    return this;
  }

  Map<String, dynamic> toUpdateUserParameter() {
    final json = <String, dynamic>{};
    json['userId'] = id;
    json['firstName'] = firstName;
    json['lastName'] = lastName;
    return json;
  }

  ApiUser fromViewModel(view_model.Usuario user) {
    id = user.id;
    emailAddress = user.email;
    firstName = user.primeiroNome;
    lastName = user.nomeFinal;
    isBetaTester = user.isBetaTester;
    return this;
  }
}

extension OnEntityUserList on List<ApiUser> {
  List<view_model.Usuario> toViewModelList() {
    List<view_model.Usuario> userList = [];
    forEach((element) {
      var newElement = element.toViewModel();
      if (newElement != null) {
        userList.add(newElement);
      }
    });
    return userList;
  }
}
