// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'profile_update_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ProfileUpdateRequest _$ProfileUpdateRequestFromJson(
        Map<String, dynamic> json) =>
    ProfileUpdateRequest(
      displayName: json['displayName'] as String?,
      bio: json['bio'] as String?,
      showNearby: json['showNearby'] as bool?,
    );

Map<String, dynamic> _$ProfileUpdateRequestToJson(
        ProfileUpdateRequest instance) =>
    <String, dynamic>{
      'displayName': instance.displayName,
      'bio': instance.bio,
      'showNearby': instance.showNearby,
    };
