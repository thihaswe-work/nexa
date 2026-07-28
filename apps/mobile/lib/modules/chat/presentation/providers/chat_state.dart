import 'package:equatable/equatable.dart';
import '../../domain/entities/conversation.dart';
import '../../domain/entities/message.dart';

enum ChatStatus { initial, loading, loaded, error }

class ChatState extends Equatable {
  final ChatStatus status;
  final List<Conversation> conversations;
  final Conversation? currentConversation;
  final List<Message> messages;
  final Map<String, bool> typingUsers;
  final Map<String, bool> onlineUsers;
  final bool isLoadingMore;
  final bool hasMoreMessages;
  final int totalMessages;
  final String? cursor;
  final String? errorMessage;
  final bool isOffline;

  const ChatState({
    this.status = ChatStatus.initial,
    this.conversations = const [],
    this.currentConversation,
    this.messages = const [],
    this.typingUsers = const {},
    this.onlineUsers = const {},
    this.isLoadingMore = false,
    this.hasMoreMessages = true,
    this.totalMessages = 0,
    this.cursor,
    this.errorMessage,
    this.isOffline = false,
  });

  bool isUserTyping(String userId) => typingUsers[userId] ?? false;
  bool isUserOnline(String userId) => onlineUsers[userId] ?? false;

  ChatState copyWith({
    ChatStatus? status,
    List<Conversation>? conversations,
    Conversation? currentConversation,
    List<Message>? messages,
    Map<String, bool>? typingUsers,
    Map<String, bool>? onlineUsers,
    bool? isLoadingMore,
    bool? hasMoreMessages,
    int? totalMessages,
    String? cursor,
    String? errorMessage,
    bool? isOffline,
  }) {
    return ChatState(
      status: status ?? this.status,
      conversations: conversations ?? this.conversations,
      currentConversation: currentConversation ?? this.currentConversation,
      messages: messages ?? this.messages,
      typingUsers: typingUsers ?? this.typingUsers,
      onlineUsers: onlineUsers ?? this.onlineUsers,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasMoreMessages: hasMoreMessages ?? this.hasMoreMessages,
      totalMessages: totalMessages ?? this.totalMessages,
      cursor: cursor ?? this.cursor,
      errorMessage: errorMessage ?? this.errorMessage,
      isOffline: isOffline ?? this.isOffline,
    );
  }

  @override
  List<Object?> get props => [
        status,
        conversations,
        currentConversation,
        messages,
        typingUsers,
        onlineUsers,
        isLoadingMore,
        hasMoreMessages,
        totalMessages,
        cursor,
        errorMessage,
        isOffline,
      ];
}
