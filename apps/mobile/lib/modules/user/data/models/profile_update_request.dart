import 'package:json_annotation/json_annotation.dart';
import '../../../../core/utils/typedefs.dart';

part 'profile_update_request.g.dart';

@JsonSerializable()
class ProfileUpdateRequest {
  final String? displayName;
  final String? bio;
  final bool? showNearby;

  const ProfileUpdateRequest({
    this.displayName,
    this.bio,
    this.showNearby,
  });

  factory ProfileUpdateRequest.fromJson(JsonMap json) =>
      _$ProfileUpdateRequestFromJson(json);

  JsonMap toJson() => _$ProfileUpdateRequestToJson(this);
}
