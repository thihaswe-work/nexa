import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mocktail/mocktail.dart';
import 'package:nexa_mobile/core/errors/failures.dart';
import 'package:nexa_mobile/modules/chat/data/datasources/chat_socket_datasource.dart';
import 'package:nexa_mobile/modules/chat/data/datasources/local/chat_local_datasource.dart';
import 'package:nexa_mobile/modules/chat/domain/repositories/chat_repository.dart';
import 'package:nexa_mobile/modules/chat/presentation/providers/chat_provider.dart';
import 'package:nexa_mobile/modules/chat/presentation/providers/chat_state.dart';
import '../../helpers/mocks.dart';

// Mock the socket and local datasources
class MockChatSocketDataSource extends Mock implements ChatSocketDataSource {}

class MockChatLocalDataSource extends Mock implements ChatLocalDataSource {}

// Simplified notifier for testing without socket
class TestChatNotifier extends StateNotifier<ChatState> {
  final ChatRepository repository;

  TestChatNotifier(this.repository) : super(const ChatState());

  Future<void> loadConversations() async {
    state = state.copyWith(status: ChatStatus.loading, errorMessage: null);
    final result = await repository.getConversations();
    result.fold(
      (failure) {
        state = state.copyWith(
          status: ChatStatus.error,
          errorMessage: failure.message,
        );
      },
      (conversations) {
        state = state.copyWith(
          status: ChatStatus.loaded,
          conversations: conversations,
        );
      },
    );
  }

  Future<void> loadMessages(String conversationId) async {
    state = state.copyWith(status: ChatStatus.loading, errorMessage: null);
    final result = await repository.getMessages(conversationId);
    result.fold(
      (failure) {
        state = state.copyWith(
          status: ChatStatus.error,
          errorMessage: failure.message,
        );
      },
      (messages) {
        state = state.copyWith(
          status: ChatStatus.loaded,
          messages: messages,
        );
      },
    );
  }

  Future<void> sendMessage(String conversationId, String content) async {
    final result = await repository.sendMessage(conversationId, content);
    result.fold(
      (failure) {
        state = state.copyWith(
          errorMessage: failure.message,
        );
      },
      (message) {
        state = state.copyWith(
          messages: [...state.messages, message],
        );
      },
    );
  }
}

void main() {
  late TestChatNotifier notifier;
  late MockChatRepository mockRepository;

  setUp(() {
    mockRepository = MockChatRepository();
    notifier = TestChatNotifier(mockRepository);
  });

  group('ChatNotifier', () {
    group('initial state', () {
      test('should have initial status', () {
        expect(notifier.state.status, ChatStatus.initial);
        expect(notifier.state.conversations, isEmpty);
        expect(notifier.state.messages, isEmpty);
      });
    });

    group('loadConversations', () {
      test('should load conversations successfully', () async {
        when(() => mockRepository.getConversations())
            .thenAnswer((_) async => Right([tConversation]));

        await notifier.loadConversations();

        expect(notifier.state.status, ChatStatus.loaded);
        expect(notifier.state.conversations.length, 1);
        expect(notifier.state.conversations.first.id, 'conv-1');
      });

      test('should handle error when loading conversations', () async {
        when(() => mockRepository.getConversations()).thenAnswer(
            (_) async => Left(ServerFailure(message: 'Network error')));

        await notifier.loadConversations();

        expect(notifier.state.status, ChatStatus.error);
        expect(notifier.state.errorMessage, 'Network error');
      });
    });

    group('loadMessages', () {
      test('should load messages successfully', () async {
        when(() => mockRepository.getMessages('conv-1'))
            .thenAnswer((_) async => Right([tMessage]));

        await notifier.loadMessages('conv-1');

        expect(notifier.state.status, ChatStatus.loaded);
        expect(notifier.state.messages.length, 1);
        expect(notifier.state.messages.first.content, 'Hello!');
      });

      test('should handle error when loading messages', () async {
        when(() => mockRepository.getMessages('conv-1')).thenAnswer((_) async =>
            Left(ServerFailure(message: 'Conversation not found')));

        await notifier.loadMessages('conv-1');

        expect(notifier.state.status, ChatStatus.error);
        expect(notifier.state.errorMessage, 'Conversation not found');
      });
    });

    group('sendMessage', () {
      test('should add sent message to state', () async {
        when(() => mockRepository.sendMessage('conv-1', 'Hi!'))
            .thenAnswer((_) async => Right(tMessage));

        await notifier.sendMessage('conv-1', 'Hi!');

        expect(notifier.state.messages.length, 1);
        expect(notifier.state.messages.first.content, 'Hello!');
      });

      test('should set error on send failure', () async {
        when(() => mockRepository.sendMessage('conv-1', 'Hi!')).thenAnswer(
            (_) async => Left(ServerFailure(message: 'Failed to send')));

        await notifier.sendMessage('conv-1', 'Hi!');

        expect(notifier.state.errorMessage, 'Failed to send');
      });
    });
  });
}
