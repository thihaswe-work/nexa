import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../entities/conversation.dart';
import '../entities/message.dart';

abstract class ChatRepository {
  Future<Either<Failure, List<Conversation>>> getConversations({
    int limit = 20,
    int offset = 0,
  });
  Future<Either<Failure, Conversation>> getOrCreatePrivateConversation(
      String userId);
  Future<Either<Failure, Conversation>> createNearbyConversation({
    required String name,
    required double lat,
    required double lng,
    double radius = 1000,
  });
  Future<Either<Failure, List<Conversation>>> getNearbyRooms({
    double? lat,
    double? lng,
    int radius = 5000,
  });
  Future<Either<Failure, void>> joinNearbyRoom(String conversationId);
  Future<Either<Failure, void>> leaveNearbyRoom(String conversationId);
  Future<Either<Failure, List<Message>>> getMessages(
    String conversationId, {
    int limit = 50,
    int offset = 0,
  });
  Future<Either<Failure, Message>> sendMessage(
    String conversationId, {
    required String content,
    String? type,
    String? replyToId,
    List<Map<String, dynamic>>? attachments,
  });
  Future<Either<Failure, Message>> editMessage(
      String messageId, String content);
  Future<Either<Failure, void>> deleteMessage(String messageId);
  Future<Either<Failure, void>> addReaction(
      String messageId, String emoji);
  Future<Either<Failure, void>> removeReaction(
      String messageId, String emoji);
}
