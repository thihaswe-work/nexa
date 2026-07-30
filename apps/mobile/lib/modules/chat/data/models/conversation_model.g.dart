// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'conversation_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ConversationModel _$ConversationModelFromJson(Map<String, dynamic> json) =>
    ConversationModel(
      id: json['id'] as String,
      name: json['name'] as String?,
      isGroup: json['isGroup'] as bool,
      isLocationBased: json['isLocationBased'] as bool? ?? false,
      locationLat: (json['locationLat'] as num?)?.toDouble(),
      locationLng: (json['locationLng'] as num?)?.toDouble(),
      locationRadius: (json['locationRadius'] as num?)?.toDouble(),
      locationName: json['locationName'] as String?,
      unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
      lastMessagePreview: json['lastMessagePreview'] as String?,
      lastMessageAt: json['lastMessageAt'] as String?,
      participants: (json['participants'] as List<dynamic>?)
              ?.map((e) =>
                  ConversationParticipant.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      participantCount: (json['participantCount'] as num?)?.toInt(),
      distanceMeters: (json['distanceMeters'] as num?)?.toDouble(),
      isJoined: json['isJoined'] as bool? ?? false,
      createdAt: json['createdAt'] as String?,
    );

Map<String, dynamic> _$ConversationModelToJson(ConversationModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'isGroup': instance.isGroup,
      'isLocationBased': instance.isLocationBased,
      'locationLat': instance.locationLat,
      'locationLng': instance.locationLng,
      'locationRadius': instance.locationRadius,
      'locationName': instance.locationName,
      'unreadCount': instance.unreadCount,
      'lastMessagePreview': instance.lastMessagePreview,
      'lastMessageAt': instance.lastMessageAt,
      'participants': instance.participants,
      'participantCount': instance.participantCount,
      'distanceMeters': instance.distanceMeters,
      'isJoined': instance.isJoined,
      'createdAt': instance.createdAt,
    };

ConversationParticipantModel _$ConversationParticipantModelFromJson(
        Map<String, dynamic> json) =>
    ConversationParticipantModel(
      userId: json['userId'] as String,
      displayName: json['displayName'] as String,
      avatarUrl: json['avatarUrl'] as String?,
      joinedAt: json['joinedAt'] as String?,
      lastReadAt: json['lastReadAt'] as String?,
      lastDeliveredAt: json['lastDeliveredAt'] as String?,
    );

Map<String, dynamic> _$ConversationParticipantModelToJson(
        ConversationParticipantModel instance) =>
    <String, dynamic>{
      'userId': instance.userId,
      'displayName': instance.displayName,
      'avatarUrl': instance.avatarUrl,
      'joinedAt': instance.joinedAt,
      'lastReadAt': instance.lastReadAt,
      'lastDeliveredAt': instance.lastDeliveredAt,
    };
