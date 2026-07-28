import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../entities/message.dart';
import '../repositories/chat_repository.dart';

class GetMessages {
  final ChatRepository _repository;

  GetMessages(this._repository);

  Future<Either<Failure, List<Message>>> call(
    String conversationId, {
    int limit = 50,
    int offset = 0,
  }) =>
      _repository.getMessages(conversationId, limit: limit, offset: offset);
}
