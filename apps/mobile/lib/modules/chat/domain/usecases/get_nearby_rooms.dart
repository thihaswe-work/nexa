import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../entities/conversation.dart';
import '../repositories/chat_repository.dart';

class GetNearbyRooms {
  final ChatRepository _repository;

  GetNearbyRooms(this._repository);

  Future<Either<Failure, List<Conversation>>> call({
    double? lat,
    double? lng,
    int radius = 5000,
  }) =>
      _repository.getNearbyRooms(lat: lat, lng: lng, radius: radius);
}
