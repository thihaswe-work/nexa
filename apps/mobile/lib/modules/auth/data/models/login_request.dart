import 'package:json_annotation/json_annotation.dart';
import '../../../../core/utils/typedefs.dart';

part 'login_request.g.dart';

@JsonSerializable()
class LoginRequest {
  final String email;
  final String password;

  const LoginRequest({required this.email, required this.password});

  factory LoginRequest.fromJson(JsonMap json) =>
      _$LoginRequestFromJson(json);

  JsonMap toJson() => _$LoginRequestToJson(this);
}
