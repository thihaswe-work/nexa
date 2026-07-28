import 'package:json_annotation/json_annotation.dart';
import '../../../../core/utils/typedefs.dart';
import '../../domain/entities/nearby_user.dart';

part 'nearby_user_model.g.dart';

@JsonSerializable()
class NearbyUserModel extends NearbyUser {
  const NearbyUserModel({
    required super.userId,
    required super.profile,
    required super.distance,
    super.lastSeen,
  });

  factory NearbyUserModel.fromJson(JsonMap json) =>
      _$NearbyUserModelFromJson(json);

  JsonMap toJson() => _$NearbyUserModelToJson(this);
}
