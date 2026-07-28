import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../repositories/chat_repository.dart';

class JoinRoom {
  final ChatRepository _repository;

  JoinRoom(this._repository);

  Future<Either<Failure, void>> call(String conversationId) =>
      _repository.joinNearbyRoom(conversationId);
}
