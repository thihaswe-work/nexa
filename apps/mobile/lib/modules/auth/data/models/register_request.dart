import 'package:json_annotation/json_annotation.dart';
import '../../../../core/utils/typedefs.dart';

part 'register_request.g.dart';

@JsonSerializable()
class RegisterRequest {
  final String email;
  final String password;
  final String displayName;

  const RegisterRequest({
    required this.email,
    required this.password,
    required this.displayName,
  });

  factory RegisterRequest.fromJson(JsonMap json) =>
      _$RegisterRequestFromJson(json);

  JsonMap toJson() => _$RegisterRequestToJson(this);
}
