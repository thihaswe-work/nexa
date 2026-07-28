import 'package:json_annotation/json_annotation.dart';
import '../../../../core/utils/typedefs.dart';
import '../../domain/entities/conversation.dart';

part 'conversation_model.g.dart';

@JsonSerializable()
class ConversationModel extends Conversation {
  const ConversationModel({
    required super.id,
    super.name,
    required super.isGroup,
    super.isLocationBased,
    super.locationLat,
    super.locationLng,
    super.locationRadius,
    super.locationName,
    super.unreadCount,
    super.lastMessagePreview,
    super.lastMessageAt,
    super.participants,
    super.participantCount,
    super.distanceMeters,
    super.isJoined,
    super.createdAt,
  });

  factory ConversationModel.fromJson(JsonMap json) =>
      _$ConversationModelFromJson(json);

  JsonMap toJson() => _$ConversationModelToJson(this);
}

@JsonSerializable()
class ConversationParticipantModel extends ConversationParticipant {
  const ConversationParticipantModel({
    required super.userId,
    required super.displayName,
    super.avatarUrl,
    super.joinedAt,
    super.lastReadAt,
    super.lastDeliveredAt,
  });

  factory ConversationParticipantModel.fromJson(JsonMap json) =>
      _$ConversationParticipantModelFromJson(json);

  JsonMap toJson() => _$ConversationParticipantModelToJson(this);
}
