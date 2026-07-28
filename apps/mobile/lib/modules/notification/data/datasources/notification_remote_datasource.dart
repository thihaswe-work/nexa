import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/utils/typedefs.dart';

final notificationRemoteDataSourceProvider =
    Provider<NotificationRemoteDataSource>((ref) {
  final dio = ref.read(dioClientProvider);
  return NotificationRemoteDataSource(dio);
});

class NotificationRemoteDataSource {
  final DioClient _dioClient;

  NotificationRemoteDataSource(this._dioClient);

  Future<JsonList> getNotifications(int limit, int offset) async {
    final response = await _dioClient.dio.get(
      ApiConstants.notifications,
      queryParameters: {'limit': limit, 'offset': offset},
    );
    return (response.data as JsonMap)['data'] as JsonList;
  }

  Future<void> markRead(String id) async {
    await _dioClient.dio.patch(ApiConstants.markRead(id));
  }

  Future<void> markAllRead() async {
    await _dioClient.dio.post(ApiConstants.markAllRead);
  }

  Future<void> deleteNotification(String id) async {
    await _dioClient.dio.delete(ApiConstants.deleteNotification(id));
  }

  Future<int> getUnreadCount() async {
    final response = await _dioClient.dio.get(
      '${ApiConstants.notifications}/unread-count',
    );
    return (response.data as JsonMap)['count'] as int;
  }
}
