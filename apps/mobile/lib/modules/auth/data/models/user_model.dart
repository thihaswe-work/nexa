import 'package:json_annotation/json_annotation.dart';
import '../../../../core/utils/typedefs.dart';
import '../../domain/entities/user.dart';

part 'user_model.g.dart';

@JsonSerializable()
class UserModel extends User {
  const UserModel({
    required super.id,
    required super.email,
    super.displayName,
    super.avatarUrl,
    super.role,
    super.isEmailVerified,
    required super.createdAt,
  });

  factory UserModel.fromJson(JsonMap json) => _$UserModelFromJson(json);

  JsonMap toJson() => _$UserModelToJson(this);
}
