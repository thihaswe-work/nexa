import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../entities/conversation.dart';
import '../repositories/chat_repository.dart';

class GetConversations {
  final ChatRepository _repository;

  GetConversations(this._repository);

  Future<Either<Failure, List<Conversation>>> call({
    int limit = 20,
    int offset = 0,
  }) =>
      _repository.getConversations(limit: limit, offset: offset);
}
