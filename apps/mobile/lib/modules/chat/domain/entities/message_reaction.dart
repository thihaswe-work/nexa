import 'package:equatable/equatable.dart';
import '../../../../core/utils/typedefs.dart';

class MessageReaction extends Equatable {
  final String emoji;
  final String userId;
  final String createdAt;

  const MessageReaction({
    required this.emoji,
    required this.userId,
    required this.createdAt,
  });

  factory MessageReaction.fromJson(JsonMap json) => MessageReaction(
        emoji: json['emoji'] as String,
        userId: json['userId'] as String,
        createdAt: json['createdAt'] as String,
      );

  JsonMap toJson() => {
        'emoji': emoji,
        'userId': userId,
        'createdAt': createdAt,
      };

  @override
  List<Object?> get props => [emoji, userId, createdAt];
}
