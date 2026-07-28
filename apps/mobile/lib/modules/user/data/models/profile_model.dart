import 'package:json_annotation/json_annotation.dart';
import '../../../../core/utils/typedefs.dart';
import '../../domain/entities/profile.dart';

part 'profile_model.g.dart';

@JsonSerializable()
class ProfileModel extends Profile {
  const ProfileModel({
    required super.userId,
    required super.displayName,
    super.bio,
    super.avatarUrl,
    super.coverUrl,
    super.lat,
    super.lng,
    super.showNearby,
    super.birthDate,
    super.gender,
    super.interests,
    required super.createdAt,
  });

  factory ProfileModel.fromJson(JsonMap json) =>
      _$ProfileModelFromJson(json);

  JsonMap toJson() => _$ProfileModelToJson(this);
}
