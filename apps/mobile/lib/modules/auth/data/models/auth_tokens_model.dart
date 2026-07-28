import 'package:json_annotation/json_annotation.dart';
import '../../../../core/utils/typedefs.dart';
import '../../domain/entities/auth_tokens.dart';

part 'auth_tokens_model.g.dart';

@JsonSerializable()
class AuthTokensModel extends AuthTokens {
  const AuthTokensModel({
    required super.accessToken,
    required super.refreshToken,
  });

  factory AuthTokensModel.fromJson(JsonMap json) =>
      _$AuthTokensModelFromJson(json);

  JsonMap toJson() => _$AuthTokensModelToJson(this);
}
