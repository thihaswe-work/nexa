import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/utils/typedefs.dart';

final chatRemoteDataSourceProvider =
    Provider<ChatRemoteDataSource>((ref) {
  final dio = ref.read(dioClientProvider);
  return ChatRemoteDataSource(dio);
});

class ChatRemoteDataSource {
  final DioClient _dioClient;

  ChatRemoteDataSource(this._dioClient);

  Future<JsonList> getConversations(int limit, int offset) async {
    final response = await _dioClient.dio.get(
      ApiConstants.conversations,
      queryParameters: {'limit': limit, 'offset': offset},
    );
    return (response.data as JsonMap)['conversations'] as JsonList;
  }

  Future<JsonMap> getOrCreatePrivateConversation(
      String participantId) async {
    final response = await _dioClient.dio.post(
      ApiConstants.privateConversation,
      data: {'participantId': participantId},
    );
    return response.data as JsonMap;
  }

  Future<JsonMap> createNearbyConversation({
    required String name,
    required double lat,
    required double lng,
    double radius = 1000,
  }) async {
    final response = await _dioClient.dio.post(
      '/chat/conversations/nearby',
      data: {
        'name': name,
        'lat': lat,
        'lng': lng,
        'radius': radius,
      },
    );
    return response.data as JsonMap;
  }

  Future<JsonList> getNearbyRooms({
    double? lat,
    double? lng,
    int radius = 5000,
  }) async {
    final params = <String, dynamic>{'radius': radius};
    if (lat != null) params['lat'] = lat;
    if (lng != null) params['lng'] = lng;

    final response = await _dioClient.dio.get(
      ApiConstants.nearbyRooms,
      queryParameters: params,
    );
    return (response.data as JsonMap)['conversations'] as JsonList;
  }

  Future<void> joinNearbyRoom(String conversationId) async {
    await _dioClient.dio.post(
      '${ApiConstants.joinRoom}/$conversationId/join',
    );
  }

  Future<void> leaveNearbyRoom(String conversationId) async {
    await _dioClient.dio.post(
      '${ApiConstants.leaveRoom}/$conversationId/leave',
    );
  }

  Future<JsonList> getMessages(
    String conversationId,
    int limit,
    int offset,
  ) async {
    final response = await _dioClient.dio.get(
      ApiConstants.messages(conversationId),
      queryParameters: {'limit': limit, 'offset': offset},
    );
    return (response.data as JsonMap)['messages'] as JsonList;
  }

  Future<JsonMap> sendMessage(
    String conversationId,
    JsonMap data,
  ) async {
    final response = await _dioClient.dio.post(
      ApiConstants.messages(conversationId),
      data: data,
    );
    return response.data as JsonMap;
  }

  Future<JsonMap> editMessage(
      String messageId, String content) async {
    final response = await _dioClient.dio.patch(
      ApiConstants.editMessage(messageId),
      data: {'content': content},
    );
    return response.data as JsonMap;
  }

  Future<void> deleteMessage(String messageId) async {
    await _dioClient.dio.delete(ApiConstants.editMessage(messageId));
  }

  Future<void> addReaction(String messageId, String emoji) async {
    await _dioClient.dio.post(
      ApiConstants.addReaction(messageId),
      data: {'emoji': emoji},
    );
  }

  Future<void> removeReaction(String messageId, String emoji) async {
    await _dioClient.dio.delete(
      ApiConstants.removeReaction(messageId, emoji),
    );
  }
}
