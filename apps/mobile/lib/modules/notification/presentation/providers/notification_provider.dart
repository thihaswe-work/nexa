import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/datasources/notification_remote_datasource.dart';
import '../../data/repositories/notification_repository_impl.dart';
import '../../domain/repositories/notification_repository.dart';
import 'notification_state.dart';

final notificationRepositoryProvider =
    Provider<NotificationRepository>((ref) {
  final remote = ref.read(notificationRemoteDataSourceProvider);
  return NotificationRepositoryImpl(remote);
});

final notificationProvider =
    StateNotifierProvider<NotificationNotifier, NotificationState>(
        (ref) {
  final repository = ref.read(notificationRepositoryProvider);
  return NotificationNotifier(repository);
});

class NotificationNotifier extends StateNotifier<NotificationState> {
  final NotificationRepository _repository;

  NotificationNotifier(this._repository)
      : super(const NotificationState());

  Future<void> loadNotifications() async {
    state = state.copyWith(
        status: NotificationStatus.loading, errorMessage: null);
    final result = await _repository.getNotifications();
    result.fold(
      (failure) => state = state.copyWith(
        status: NotificationStatus.error,
        errorMessage: failure.message,
      ),
      (notifications) {
        final unread =
            notifications.where((n) => !n.isRead).length;
        state = state.copyWith(
          status: NotificationStatus.loaded,
          notifications: notifications,
          unreadCount: unread,
        );
      },
    );
  }

  Future<void> markRead(String id) async {
    final result = await _repository.markRead(id);
    result.fold(
      (failure) => state = state.copyWith(
        status: NotificationStatus.error,
        errorMessage: failure.message,
      ),
      (_) {
        final updated = state.notifications.map((n) {
          if (n.id == id) return n.copyWith(isRead: true);
          return n;
        }).toList();
        state = state.copyWith(
          notifications: updated,
          unreadCount: updated.where((n) => !n.isRead).length,
        );
      },
    );
  }

  Future<void> markAllRead() async {
    final result = await _repository.markAllRead();
    result.fold(
      (failure) => state = state.copyWith(
        status: NotificationStatus.error,
        errorMessage: failure.message,
      ),
      (_) => state = state.copyWith(
        unreadCount: 0,
        notifications: state.notifications
            .map((n) => n.copyWith(isRead: true))
            .toList(),
      ),
    );
  }

  Future<void> deleteNotification(String id) async {
    final result = await _repository.deleteNotification(id);
    result.fold(
      (failure) => state = state.copyWith(
        status: NotificationStatus.error,
        errorMessage: failure.message,
      ),
      (_) {
        final updated =
            state.notifications.where((n) => n.id != id).toList();
        state = state.copyWith(
          notifications: updated,
          unreadCount: updated.where((n) => !n.isRead).length,
        );
      },
    );
  }

  void clearError() {
    state = state.copyWith(errorMessage: null);
  }
}
