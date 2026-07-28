import 'package:json_annotation/json_annotation.dart';
import '../../../../core/utils/typedefs.dart';
import 'user_model.dart';

part 'auth_response.g.dart';

@JsonSerializable()
class AuthResponse {
  final String accessToken;
  final String refreshToken;
  final UserModel user;

  const AuthResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  factory AuthResponse.fromJson(JsonMap json) =>
      _$AuthResponseFromJson(json);

  JsonMap toJson() => _$AuthResponseToJson(this);
}
