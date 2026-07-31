import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/core/storage/secure_storage.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const channel = MethodChannel('plugins.it_nomads.com/flutter_secure_storage');
  final store = <String, String>{};

  setUp(() {
    store.clear();
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (call) async {
      switch (call.method) {
        case 'read':
          return store[call.arguments['key'] as String];
        case 'write':
          store[call.arguments['key'] as String] =
              call.arguments['value'] as String;
          return null;
        case 'delete':
          store.remove(call.arguments['key'] as String);
          return null;
      }
      return null;
    });
  });

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, null);
  });

  group('SecureStorage', () {
    test('saveTokens stores both tokens', () async {
      final storage = SecureStorage();
      await storage.saveTokens('access-token', 'refresh-token');

      expect(await storage.getAccessToken(), 'access-token');
      expect(await storage.getRefreshToken(), 'refresh-token');
    });

    test('saveTokens returns void', () async {
      final result = SecureStorage().saveTokens('access', 'refresh');
      expect(result, isA<Future<void>>());
      await result;
    });

    test('getAccessToken returns null when empty', () async {
      expect(await SecureStorage().getAccessToken(), isNull);
    });

    test('clearTokens clears stored tokens and user data', () async {
      final storage = SecureStorage();
      await storage.saveTokens('access', 'refresh');
      await storage.saveUserId('user-1');
      await storage.saveUserEmail('test@test.com');

      await storage.clearTokens();

      expect(await storage.getAccessToken(), isNull);
      expect(await storage.getRefreshToken(), isNull);
      expect(await storage.getUserId(), isNull);
      expect(await storage.getUserEmail(), isNull);
    });

    test('saveUserId and getUserId work together', () async {
      final storage = SecureStorage();
      await storage.saveUserId('user-1');
      expect(await storage.getUserId(), 'user-1');
    });

    test('saveUserEmail and getUserEmail work together', () async {
      final storage = SecureStorage();
      await storage.saveUserEmail('test@test.com');
      expect(await storage.getUserEmail(), 'test@test.com');
    });
  });
}
