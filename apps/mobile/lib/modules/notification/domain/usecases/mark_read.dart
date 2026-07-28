import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../repositories/notification_repository.dart';

class MarkRead {
  final NotificationRepository _repository;

  MarkRead(this._repository);

  Future<Either<Failure, void>> call(String id) =>
      _repository.markRead(id);
}
