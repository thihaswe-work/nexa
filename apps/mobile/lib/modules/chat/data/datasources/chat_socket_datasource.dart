import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/socket/socket_client.dart';
import '../../domain/entities/message.dart';

final chatSocketDataSourceProvider =
    Provider<ChatSocketDataSource>((ref) {
  final socket = ref.read(socketClientProvider);
  return ChatSocketDataSource(socket);
});

class ChatSocketDataSource {
  final SocketClient _socket;
  final StreamController<Message> _messageController =
      StreamController<Message>.broadcast();
  final StreamController<Message> _messageUpdatedController =
      StreamController<Message>.broadcast();
  final StreamController<String> _messageDeletedController =
      StreamController<String>.broadcast();
  final StreamController<Map<String, dynamic>> _reactionController =
      StreamController<Map<String, dynamic>>.broadcast();

  Stream<Message> get onMessageCreated => _messageController.stream;
  Stream<Message> get onMessageUpdated => _messageUpdatedController.stream;
  Stream<String> get onMessageDeleted => _messageDeletedController.stream;
  Stream<Map<String, dynamic>> get onReaction =>
      _reactionController.stream;

  StreamSubscription? _subscription;

  ChatSocketDataSource(this._socket);

  void connect() {
    _socket.connect();
    _subscription = _socket.stream.listen(_handleEvent);
  }

  void disconnect() {
    _subscription?.cancel();
    _socket.disconnect();
  }

  void _handleEvent(Map<String, dynamic> event) {
    final eventName = event['event'] as String?;
    final data = event['data'] as Map<String, dynamic>?;
    if (data == null) return;

    switch (eventName) {
      case 'chat:message:created':
        _messageController.add(Message(
          id: data['id'] as String,
          conversationId: data['conversationId'] as String,
          senderId: data['senderId'] as String,
          senderName: data['senderName'] as String,
          content: data['content'] as String?,
          type: data['type'] as String? ?? 'TEXT',
          createdAt: data['createdAt'] as String,
        ));
        break;
      case 'chat:message:updated':
        _messageUpdatedController.add(Message(
          id: data['id'] as String,
          conversationId: data['conversationId'] as String,
          senderId: data['senderId'] as String,
          senderName: data['senderName'] as String,
          content: data['content'] as String?,
          type: data['type'] as String? ?? 'TEXT',
          createdAt: data['createdAt'] as String,
        ));
        break;
      case 'chat:message:deleted':
        _messageDeletedController.add(data['messageId'] as String);
        break;
      case 'chat:reaction:added':
      case 'chat:reaction:removed':
        _reactionController.add(data);
        break;
    }
  }

  void sendTyping(String conversationId) {
    _socket.emit('typing:start', {
      'conversationId': conversationId,
    });
  }

  void sendStopTyping(String conversationId) {
    _socket.emit('typing:stop', {
      'conversationId': conversationId,
    });
  }

  void markDelivered(String conversationId, String messageId) {
    _socket.emit('message:delivered', {
      'conversationId': conversationId,
      'messageId': messageId,
    });
  }

  void markRead(String conversationId, String messageId) {
    _socket.emit('message:read', {
      'conversationId': conversationId,
      'messageId': messageId,
    });
  }

  void dispose() {
    _messageController.close();
    _messageUpdatedController.close();
    _messageDeletedController.close();
    _reactionController.close();
    _subscription?.cancel();
  }
}
