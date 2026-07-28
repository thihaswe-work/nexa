import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../entities/message.dart';
import '../repositories/chat_repository.dart';

class SendMessage {
  final ChatRepository _repository;

  SendMessage(this._repository);

  Future<Either<Failure, Message>> call(
    String conversationId, {
    required String content,
    String? type,
    String? replyToId,
    List<Map<String, dynamic>>? attachments,
  }) =>
      _repository.sendMessage(
        conversationId,
        content: content,
        type: type,
        replyToId: replyToId,
        attachments: attachments,
      );
}
