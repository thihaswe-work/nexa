import 'package:equatable/equatable.dart';

class Conversation extends Equatable {
  final String id;
  final String? name;
  final bool isGroup;
  final bool isLocationBased;
  final double? locationLat;
  final double? locationLng;
  final double? locationRadius;
  final String? locationName;
  final int unreadCount;
  final String? lastMessagePreview;
  final String? lastMessageAt;
  final List<ConversationParticipant> participants;
  final int? participantCount;
  final double? distanceMeters;
  final bool isJoined;
  final String? createdAt;

  const Conversation({
    required this.id,
    this.name,
    this.isGroup = false,
    this.isLocationBased = false,
    this.locationLat,
    this.locationLng,
    this.locationRadius,
    this.locationName,
    this.unreadCount = 0,
    this.lastMessagePreview,
    this.lastMessageAt,
    this.participants = const [],
    this.participantCount,
    this.distanceMeters,
    this.isJoined = false,
    this.createdAt,
  });

  @override
  List<Object?> get props => [
        id,
        name,
        isGroup,
        isLocationBased,
        locationLat,
        locationLng,
        locationRadius,
        locationName,
        unreadCount,
        lastMessagePreview,
        lastMessageAt,
        participants,
        participantCount,
        distanceMeters,
        isJoined,
        createdAt,
      ];
}

class ConversationParticipant extends Equatable {
  final String userId;
  final String displayName;
  final String? avatarUrl;
  final String? joinedAt;
  final String? lastReadAt;
  final String? lastDeliveredAt;

  const ConversationParticipant({
    required this.userId,
    required this.displayName,
    this.avatarUrl,
    this.joinedAt,
    this.lastReadAt,
    this.lastDeliveredAt,
  });

  @override
  List<Object?> get props => [
        userId,
        displayName,
        avatarUrl,
        joinedAt,
        lastReadAt,
        lastDeliveredAt,
      ];
}
