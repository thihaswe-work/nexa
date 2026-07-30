import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/datasources/chat_remote_datasource.dart';
import '../../data/datasources/chat_socket_datasource.dart';
import '../../data/datasources/local/chat_local_datasource.dart';
import '../../data/repositories/chat_repository_impl.dart';
import '../../domain/entities/conversation.dart';
import '../../domain/entities/message.dart';
import '../../domain/repositories/chat_repository.dart';
import 'chat_state.dart';

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  final remote = ref.read(chatRemoteDataSourceProvider);
  return ChatRepositoryImpl(remote);
});

final chatProvider =
    StateNotifierProvider<ChatNotifier, ChatState>((ref) {
  final repository = ref.read(chatRepositoryProvider);
  final socket = ref.read(chatSocketDataSourceProvider);
  final local = ref.read(chatLocalDataSourceProvider);
  return ChatNotifier(repository, socket, local, ref);
});

class ChatNotifier extends StateNotifier<ChatState> {
  final ChatRepository _repository;
  final ChatSocketDataSource _socket;
  final ChatLocalDataSource _local;
  final Ref _ref;
  StreamSubscription<Message>? _messageSub;
  StreamSubscription<Message>? _updatedSub;
  StreamSubscription<String>? _deletedSub;
  StreamSubscription<Map<String, dynamic>>? _reactionSub;
  Timer? _typingThrottle;
  bool _isTyping = false;

  ChatNotifier(this._repository, this._socket, this._local, this._ref)
      : super(const ChatState()) {
    _initSocket();
    _loadCached();
  }

  void _initSocket() {
    _socket.connect();
    _messageSub = _socket.onMessageCreated.listen(_handleNewMessage);
    _updatedSub = _socket.onMessageUpdated.listen(_handleUpdatedMessage);
    _deletedSub = _socket.onMessageDeleted.listen(_handleDeletedMessage);
    _reactionSub = _socket.onReaction.listen(_handleReaction);
  }

  Future<void> _loadCached() async {
    final cached = _local.getCachedConversations();
    if (cached != null && state.conversations.isEmpty) {
      final convs = cached
          .map((j) => Conversation(
                id: j['id'] as String,
                name: j['name'] as String?,
                isGroup: j['isGroup'] as bool? ?? false,
                lastMessagePreview: j['lastMessagePreview'] as String?,
                lastMessageAt: j['lastMessageAt'] as String?,
                unreadCount: j['unreadCount'] as int? ?? 0,
              ))
          .toList();
      state = state.copyWith(conversations: convs);
    }
  }

  // ─── Conversations ───────────────────────────

  Future<void> loadConversations() async {
    state = state.copyWith(status: ChatStatus.loading, errorMessage: null);
    final result = await _repository.getConversations();
    result.fold(
      (failure) {
        state = state.copyWith(
          status: ChatStatus.error,
          errorMessage: failure.message,
          isOffline: true,
        );
      },
      (conversations) {
        state = state.copyWith(
          status: ChatStatus.loaded,
          conversations: conversations,
          isOffline: false,
        );
        _cacheConversations(conversations);
      },
    );
  }

  Future<void> _cacheConversations(List<Conversation> conversations) async {
    final jsonList = conversations
        .map((c) => {
              'id': c.id,
              'name': c.name,
              'isGroup': c.isGroup,
              'lastMessagePreview': c.lastMessagePreview,
              'lastMessageAt': c.lastMessageAt,
              'unreadCount': c.unreadCount,
            })
        .toList();
    await _local.cacheConversations(jsonList);
  }

  // ─── Messages ────────────────────────────────

  Future<void> loadMessages(String conversationId) async {
    state = state.copyWith(
      status: ChatStatus.loading,
      currentConversation:
          state.conversations.where((c) => c.id == conversationId).firstOrNull,
      messages: [],
      cursor: null,
      hasMoreMessages: true,
      errorMessage: null,
    );

    final result = await _repository.getMessages(conversationId);
    result.fold(
      (failure) {
        final cached = _local.getCachedMessages(conversationId);
        if (cached != null) {
          final msgs = cached.map((j) => Message(
                id: j['id'] as String,
                conversationId: conversationId,
                senderId: j['senderId'] as String,
                senderName: j['senderName'] as String,
                content: j['content'] as String?,
                type: j['type'] as String? ?? 'TEXT',
                createdAt: j['createdAt'] as String,
              )).toList();
          state = state.copyWith(
            status: ChatStatus.loaded,
            messages: msgs,
            isOffline: true,
          );
        } else {
          state = state.copyWith(
            status: ChatStatus.error,
            errorMessage: failure.message,
            isOffline: true,
          );
        }
      },
      (messages) {
        state = state.copyWith(
          status: ChatStatus.loaded,
          messages: messages,
          hasMoreMessages: messages.length >= 50,
          totalMessages: messages.length,
          isOffline: false,
        );
        _cacheMessages(conversationId, messages);
      },
    );
  }

  Future<void> loadMoreMessages(String conversationId) async {
    if (state.isLoadingMore || !state.hasMoreMessages) return;
    state = state.copyWith(isLoadingMore: true);

    final result = await _repository.getMessages(
      conversationId,
      offset: state.messages.length,
    );
    result.fold(
      (_) => state = state.copyWith(isLoadingMore: false),
      (messages) {
        state = state.copyWith(
          isLoadingMore: false,
          messages: [...state.messages, ...messages],
          hasMoreMessages: messages.length >= 50,
          totalMessages: state.totalMessages + messages.length,
        );
      },
    );
  }

  Future<void> _cacheMessages(
      String conversationId, List<Message> messages) async {
    final jsonList = messages
        .map((m) => {
              'id': m.id,
              'senderId': m.senderId,
              'senderName': m.senderName,
              'content': m.content,
              'type': m.type,
              'createdAt': m.createdAt,
              'deliveredAt': m.deliveredAt,
              'readAt': m.readAt,
            })
        .toList();
    await _local.cacheMessages(conversationId, jsonList);
  }

  // ─── Send Message ────────────────────────────

  Future<void> sendMessage(String conversationId, String content,
      {List<Map<String, dynamic>>? attachments}) async {
    final tempId = 'temp_${DateTime.now().millisecondsSinceEpoch}';
    final optimistic = Message(
      id: tempId,
      conversationId: conversationId,
      senderId: 'current_user',
      senderName: 'You',
      content: content,
      type: attachments != null ? 'IMAGE' : 'TEXT',
      createdAt: DateTime.now().toIso8601String(),
    );

    state = state.copyWith(messages: [...state.messages, optimistic]);

    final result = await _repository.sendMessage(
      conversationId,
      content: content,
      attachments: attachments,
    );
    result.fold(
      (_) {
        final pending = {
          'tempId': tempId,
          'conversationId': conversationId,
          'content': content,
        };
        _local.queuePendingMessage(pending);
      },
      (message) {
        _replaceTempMessage(tempId, message);
        _local.removePendingMessage(tempId);
      },
    );
  }

  void _replaceTempMessage(String tempId, Message message) {
    final updated = state.messages.map((m) {
      return m.id == tempId ? message : m;
    }).toList();
    state = state.copyWith(messages: updated);
  }

  // ─── Typing Indicator ────────────────────────

  void startTyping(String conversationId) {
    if (!_isTyping) {
      _isTyping = true;
      _socket.sendTyping(conversationId);
    }
    _typingThrottle?.cancel();
    _typingThrottle = Timer(const Duration(seconds: 2), () {
      _isTyping = false;
      _socket.sendStopTyping(conversationId);
    });
  }

  void stopTyping(String conversationId) {
    _typingThrottle?.cancel();
    _isTyping = false;
    _socket.sendStopTyping(conversationId);
  }

  // ─── Read Receipts ───────────────────────────

  void markMessageRead(String conversationId, String messageId) {
    _socket.markRead(conversationId, messageId);
  }

  void markMessageDelivered(String conversationId, String messageId) {
    _socket.markDelivered(conversationId, messageId);
  }

  // ─── Socket Handlers ─────────────────────────

  void _handleNewMessage(Message message) {
    final exists = state.messages.any((m) => m.id == message.id);
    if (!exists) {
      state = state.copyWith(messages: [...state.messages, message]);
    }
    _local.appendMessage(message.conversationId, {
      'id': message.id,
      'senderId': message.senderId,
      'senderName': message.senderName,
      'content': message.content,
      'type': message.type,
      'createdAt': message.createdAt,
    });
  }

  void _handleUpdatedMessage(Message message) {
    final updated = state.messages.map((m) {
      return m.id == message.id ? message : m;
    }).toList();
    state = state.copyWith(messages: updated);
    _local.updateMessage(message.conversationId, message.id, {
      'content': message.content,
      'editedAt': message.editedAt,
    });
  }

  void _handleDeletedMessage(String messageId) {
    final updated = state.messages.where((m) => m.id != messageId).toList();
    state = state.copyWith(messages: updated);
  }

  void _handleReaction(Map<String, dynamic> data) {
    // update local message reactions
  }

  // ─── Online Status ───────────────────────────

  void setOnlineUsers(Map<String, bool> users) {
    state = state.copyWith(onlineUsers: users);
  }

  void setUserTyping(String userId, bool isTyping) {
    state = state.copyWith(
      typingUsers: {...state.typingUsers, userId: isTyping},
    );
  }

  // ─── Cleanup ─────────────────────────────────

  @override
  void dispose() {
    _messageSub?.cancel();
    _updatedSub?.cancel();
    _deletedSub?.cancel();
    _reactionSub?.cancel();
    _typingThrottle?.cancel();
    _socket.dispose();
    super.dispose();
  }

  void clearError() {
    state = state.copyWith(errorMessage: null);
  }
}
