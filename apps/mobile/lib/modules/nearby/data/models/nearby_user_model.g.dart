// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'nearby_user_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

NearbyUserModel _$NearbyUserModelFromJson(Map<String, dynamic> json) =>
    NearbyUserModel(
      userId: json['userId'] as String,
      profile: Profile.fromJson(json['profile'] as Map<String, dynamic>),
      distance: (json['distance'] as num).toDouble(),
      lastSeen: json['lastSeen'] == null
          ? null
          : DateTime.parse(json['lastSeen'] as String),
    );

Map<String, dynamic> _$NearbyUserModelToJson(NearbyUserModel instance) =>
    <String, dynamic>{
      'userId': instance.userId,
      'profile': instance.profile,
      'distance': instance.distance,
      'lastSeen': instance.lastSeen?.toIso8601String(),
    };
