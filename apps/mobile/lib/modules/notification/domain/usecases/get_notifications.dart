import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../entities/notification.dart';
import '../repositories/notification_repository.dart';

class GetNotifications {
  final NotificationRepository _repository;

  GetNotifications(this._repository);

  Future<Either<Failure, List<Notification>>> call({
    int limit = 20,
    int offset = 0,
  }) =>
      _repository.getNotifications(limit: limit, offset: offset);
}
