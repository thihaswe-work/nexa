import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/errors/exceptions.dart';
import '../../domain/entities/conversation.dart';
import '../../domain/entities/message.dart';
import '../../domain/repositories/chat_repository.dart';
import '../datasources/chat_remote_datasource.dart';
import '../models/conversation_model.dart';
import '../models/message_model.dart';
import '../models/send_message_request.dart';

class ChatRepositoryImpl implements ChatRepository {
  final ChatRemoteDataSource _remote;

  ChatRepositoryImpl(this._remote);

  @override
  Future<Either<Failure, List<Conversation>>> getConversations({
    int limit = 20,
    int offset = 0,
  }) async {
    try {
      final jsonList = await _remote.getConversations(limit, offset);
      final conversations =
          jsonList.map((j) => ConversationModel.fromJson(j)).toList();
      return Right(conversations);
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Conversation>> getOrCreatePrivateConversation(
      String userId) async {
    try {
      final json = await _remote.getOrCreatePrivateConversation(userId);
      return Right(ConversationModel.fromJson(json));
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Conversation>> createNearbyConversation({
    required String name,
    required double lat,
    required double lng,
    double radius = 1000,
  }) async {
    try {
      final json = await _remote.createNearbyConversation(
        name: name,
        lat: lat,
        lng: lng,
        radius: radius,
      );
      return Right(ConversationModel.fromJson(json));
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<Conversation>>> getNearbyRooms({
    double? lat,
    double? lng,
    int radius = 5000,
  }) async {
    try {
      final jsonList = await _remote.getNearbyRooms(
        lat: lat,
        lng: lng,
        radius: radius,
      );
      final rooms =
          jsonList.map((j) => ConversationModel.fromJson(j)).toList();
      return Right(rooms);
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> joinNearbyRoom(
      String conversationId) async {
    try {
      await _remote.joinNearbyRoom(conversationId);
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> leaveNearbyRoom(
      String conversationId) async {
    try {
      await _remote.leaveNearbyRoom(conversationId);
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<Message>>> getMessages(
    String conversationId, {
    int limit = 50,
    int offset = 0,
  }) async {
    try {
      final jsonList =
          await _remote.getMessages(conversationId, limit, offset);
      final messages =
          jsonList.map((j) => MessageModel.fromJson(j)).toList();
      return Right(messages);
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Message>> sendMessage(
    String conversationId, {
    required String content,
    String? type,
    String? replyToId,
    List<Map<String, dynamic>>? attachments,
  }) async {
    try {
      final request = SendMessageRequest(
        content: content,
        type: type,
        replyToId: replyToId,
        attachments: attachments
            ?.map((a) => AttachmentEntry(
                  key: a['key'] as String,
                  type: a['type'] as String,
                  fileName: a['fileName'] as String?,
                  fileSize: a['fileSize'] as int?,
                  mimeType: a['mimeType'] as String?,
                  width: a['width'] as int?,
                  height: a['height'] as int?,
                  duration: a['duration'] as int?,
                ))
            .toList(),
      );
      final json = await _remote.sendMessage(
        conversationId,
        request.toJson(),
      );
      return Right(MessageModel.fromJson(json));
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Message>> editMessage(
      String messageId, String content) async {
    try {
      final json = await _remote.editMessage(messageId, content);
      return Right(MessageModel.fromJson(json));
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> deleteMessage(String messageId) async {
    try {
      await _remote.deleteMessage(messageId);
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> addReaction(
      String messageId, String emoji) async {
    try {
      await _remote.addReaction(messageId, emoji);
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> removeReaction(
      String messageId, String emoji) async {
    try {
      await _remote.removeReaction(messageId, emoji);
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}
