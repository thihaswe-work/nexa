import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../repositories/notification_repository.dart';

class MarkAllRead {
  final NotificationRepository _repository;

  MarkAllRead(this._repository);

  Future<Either<Failure, void>> call() =>
      _repository.markAllRead();
}
