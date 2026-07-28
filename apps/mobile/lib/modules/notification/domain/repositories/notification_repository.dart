import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../entities/notification.dart';

abstract class NotificationRepository {
  Future<Either<Failure, List<Notification>>> getNotifications({
    int limit = 20,
    int offset = 0,
  });
  Future<Either<Failure, void>> markRead(String id);
  Future<Either<Failure, void>> markAllRead();
  Future<Either<Failure, void>> deleteNotification(String id);
  Future<Either<Failure, int>> getUnreadCount();
}
