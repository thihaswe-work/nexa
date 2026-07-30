import 'dart:convert';
import 'package:mocktail/mocktail.dart';
import 'package:fpdart/fpdart.dart';
import 'package:nexa_mobile/core/errors/failures.dart';
import 'package:nexa_mobile/core/storage/secure_storage.dart';
import 'package:nexa_mobile/modules/auth/domain/entities/auth_tokens.dart';
import 'package:nexa_mobile/modules/auth/domain/entities/user.dart';
import 'package:nexa_mobile/modules/auth/domain/repositories/auth_repository.dart';
import 'package:nexa_mobile/modules/user/domain/entities/profile.dart';
import 'package:nexa_mobile/modules/user/domain/entities/interest.dart';
import 'package:nexa_mobile/modules/user/domain/repositories/user_repository.dart';
import 'package:nexa_mobile/modules/chat/domain/entities/conversation.dart';
import 'package:nexa_mobile/modules/chat/domain/entities/message.dart';
import 'package:nexa_mobile/modules/chat/domain/repositories/chat_repository.dart';
import 'package:nexa_mobile/modules/nearby/domain/entities/location.dart';
import 'package:nexa_mobile/modules/nearby/domain/entities/nearby_user.dart';
import 'package:nexa_mobile/modules/nearby/domain/repositories/nearby_repository.dart';
import 'package:nexa_mobile/modules/notification/domain/entities/notification.dart';
import 'package:nexa_mobile/modules/notification/domain/repositories/notification_repository.dart';
import 'package:nexa_mobile/modules/settings/domain/entities/app_settings.dart';
import 'package:nexa_mobile/modules/settings/domain/repositories/settings_repository.dart';

// ─── Mock Classes ─────────────────────────────
class MockSecureStorage extends Mock implements SecureStorage {}

class MockAuthRepository extends Mock implements AuthRepository {}

class MockUserRepository extends Mock implements UserRepository {}

class MockChatRepository extends Mock implements ChatRepository {}

class MockNearbyRepository extends Mock implements NearbyRepository {}

class MockNotificationRepository extends Mock
    implements NotificationRepository {}

class MockSettingsRepository extends Mock implements SettingsRepository {}

// ─── Test Data ─────────────────────────────────
final tUser = User(
  id: 'user-1',
  email: 'test@example.com',
  displayName: 'Test User',
  avatarUrl: null,
  role: 'user',
  isEmailVerified: true,
  createdAt: DateTime(2024, 1, 1),
);

final tAuthTokens = AuthTokens(
  accessToken: 'access-token-123',
  refreshToken: 'refresh-token-456',
);

final tProfile = Profile(
  id: 'profile-1',
  userId: 'user-1',
  displayName: 'Test User',
  bio: 'Hello world',
  avatarUrl: null,
  coverUrl: null,
  city: 'New York',
  country: 'US',
  interests: [
    Interest(id: 'int-1', name: 'Photography', category: 'Arts'),
  ],
);

final tConversation = Conversation(
  id: 'conv-1',
  name: 'Test Chat',
  isGroup: false,
  lastMessagePreview: 'Hello!',
  lastMessageAt: '2024-01-15T10:00:00Z',
  unreadCount: 2,
);

final tMessage = Message(
  id: 'msg-1',
  conversationId: 'conv-1',
  senderId: 'user-1',
  senderName: 'Test User',
  content: 'Hello!',
  type: 'TEXT',
  createdAt: '2024-01-15T10:00:00Z',
);

final tNearbyUser = NearbyUser(
  userId: 'user-2',
  displayName: 'Nearby User',
  avatarUrl: null,
  distance: 150.0,
  lastSeen: DateTime.now(),
  isOnline: true,
);

final tLocation = Location(
  lat: 40.7128,
  lng: -74.0060,
);

final tAppNotification = AppNotification(
  id: 'notif-1',
  type: 'MESSAGE',
  title: 'New Message',
  body: 'You got a message',
  isRead: false,
  createdAt: DateTime(2024, 1, 15, 10, 0),
);

final tAppSettings = AppSettings(
  isDarkMode: false,
  showOnline: true,
  showLocation: true,
  notificationsEnabled: true,
  nearbyRadius: 1000,
);

// ─── Matchers ─────────────────────────────────
Map<String, dynamic> Function() matchSaveTokens() {
  return any<Map<String, dynamic> Function()>();
}

void registerFallbackValues() {
  registerFallbackValue(tUser);
  registerFallbackValue(tAuthTokens);
  registerFallbackValue(tProfile);
  registerFallbackValue(tConversation);
  registerFallbackValue(tMessage);
  registerFallbackValue(tNearbyUser);
  registerFallbackValue(tLocation);
  registerFallbackValue(tAppNotification);
  registerFallbackValue(tAppSettings);
}
