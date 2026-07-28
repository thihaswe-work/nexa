import 'package:equatable/equatable.dart';

class MessageReaction extends Equatable {
  final String emoji;
  final String userId;
  final String createdAt;

  const MessageReaction({
    required this.emoji,
    required this.userId,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [emoji, userId, createdAt];
}
