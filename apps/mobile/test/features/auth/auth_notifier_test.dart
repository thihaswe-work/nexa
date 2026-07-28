import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mocktail/mocktail.dart';
import 'package:nexa_mobile/core/errors/failures.dart';
import 'package:nexa_mobile/modules/auth/domain/entities/auth_tokens.dart';
import 'package:nexa_mobile/modules/auth/domain/entities/user.dart';
import 'package:nexa_mobile/modules/auth/domain/repositories/auth_repository.dart';
import 'package:nexa_mobile/modules/auth/presentation/providers/auth_notifier.dart';
import 'package:nexa_mobile/modules/auth/presentation/providers/auth_state.dart';
import '../../helpers/mocks.dart';

void main() {
  late AuthNotifier notifier;
  late MockAuthRepository mockRepository;

  setUp(() {
    mockRepository = MockAuthRepository();
    notifier = AuthNotifier(mockRepository);
  });

  group('initial state', () {
    test('should have initial status', () {
      expect(notifier.state.status, AuthStatus.initial);
      expect(notifier.state.user, isNull);
      expect(notifier.state.errorMessage, isNull);
    });
  });

  group('login', () {
    const email = 'test@example.com';
    const password = 'password123';

    test('should authenticate on successful login', () async {
      when(() => mockRepository.login(email, password))
          .thenAnswer((_) async => Right(tAuthTokens));
      when(() => mockRepository.getCurrentUser())
          .thenAnswer((_) async => Right(tUser));

      await notifier.login(email, password);

      expect(notifier.state.status, AuthStatus.authenticated);
      expect(notifier.state.user, tUser);
      verify(() => mockRepository.login(email, password)).called(1);
      verify(() => mockRepository.getCurrentUser()).called(1);
    });

    test('should set loading state while logging in', () async {
      when(() => mockRepository.login(email, password))
          .thenAnswer((_) async => Right(tAuthTokens));
      when(() => mockRepository.getCurrentUser())
          .thenAnswer((_) async => Right(tUser));

      final future = notifier.login(email, password);
      expect(notifier.state.status, AuthStatus.loading);
      await future;
    });

    test('should set error on login failure', () async {
      when(() => mockRepository.login(email, password))
          .thenAnswer((_) async => Left(ServerFailure(message: 'Invalid credentials', statusCode: 401)));

      await notifier.login(email, password);

      expect(notifier.state.status, AuthStatus.error);
      expect(notifier.state.errorMessage, 'Invalid credentials');
      expect(notifier.state.user, isNull);
    });

    test('should set error if getCurrentUser fails after login', () async {
      when(() => mockRepository.login(email, password))
          .thenAnswer((_) async => Right(tAuthTokens));
      when(() => mockRepository.getCurrentUser())
          .thenAnswer((_) async => Left(ServerFailure(message: 'Failed to fetch user')));

      await notifier.login(email, password);

      expect(notifier.state.status, AuthStatus.error);
      expect(notifier.state.errorMessage, 'Failed to fetch user');
    });
  });

  group('register', () {
    const email = 'new@example.com';
    const password = 'password123';
    const displayName = 'New User';

    test('should authenticate on successful registration', () async {
      when(() => mockRepository.register(email, password, displayName))
          .thenAnswer((_) async => Right(tAuthTokens));
      when(() => mockRepository.getCurrentUser())
          .thenAnswer((_) async => Right(tUser));

      await notifier.register(email, password, displayName);

      expect(notifier.state.status, AuthStatus.authenticated);
      expect(notifier.state.user, tUser);
    });

    test('should set error on registration failure', () async {
      when(() => mockRepository.register(email, password, displayName))
          .thenAnswer((_) async => Left(ValidationFailure(message: 'Email already taken')));

      await notifier.register(email, password, displayName);

      expect(notifier.state.status, AuthStatus.error);
      expect(notifier.state.errorMessage, 'Email already taken');
    });
  });

  group('logout', () {
    test('should set unauthenticated on successful logout', () async {
      when(() => mockRepository.logout()).thenAnswer((_) async => const Right(null));

      await notifier.logout();

      expect(notifier.state.status, AuthStatus.unauthenticated);
      expect(notifier.state.user, isNull);
    });

    test('should set error on logout failure', () async {
      when(() => mockRepository.logout())
          .thenAnswer((_) async => Left(ServerFailure(message: 'Network error')));

      await notifier.logout();

      expect(notifier.state.status, AuthStatus.error);
      expect(notifier.state.errorMessage, 'Network error');
    });
  });

  group('checkAuth', () {
    test('should authenticate if user is already authenticated', () async {
      when(() => mockRepository.isAuthenticated()).thenAnswer((_) async => true);
      when(() => mockRepository.getCurrentUser())
          .thenAnswer((_) async => Right(tUser));

      await notifier.checkAuth();

      expect(notifier.state.status, AuthStatus.authenticated);
      expect(notifier.state.user, tUser);
    });

    test('should set unauthenticated if not authenticated', () async {
      when(() => mockRepository.isAuthenticated()).thenAnswer((_) async => false);

      await notifier.checkAuth();

      expect(notifier.state.status, AuthStatus.unauthenticated);
      expect(notifier.state.user, isNull);
    });

    test('should set unauthenticated if getCurrentUser fails', () async {
      when(() => mockRepository.isAuthenticated()).thenAnswer((_) async => true);
      when(() => mockRepository.getCurrentUser())
          .thenAnswer((_) async => Left(ServerFailure(message: 'Token expired')));

      await notifier.checkAuth();

      expect(notifier.state.status, AuthStatus.unauthenticated);
    });
  });

  group('forgotPassword', () {
    test('should set unauthenticated on success', () async {
      when(() => mockRepository.forgotPassword('test@test.com'))
          .thenAnswer((_) async => const Right(null));

      await notifier.forgotPassword('test@test.com');

      expect(notifier.state.status, AuthStatus.unauthenticated);
    });

    test('should set error on failure', () async {
      when(() => mockRepository.forgotPassword('test@test.com'))
          .thenAnswer((_) async => Left(ServerFailure(message: 'Email not found')));

      await notifier.forgotPassword('test@test.com');

      expect(notifier.state.status, AuthStatus.error);
      expect(notifier.state.errorMessage, 'Email not found');
    });
  });

  group('clearError', () {
    test('should clear error message', () async {
      when(() => mockRepository.login(any(), any()))
          .thenAnswer((_) async => Left(ServerFailure(message: 'Error')));

      await notifier.login('a@b.com', 'pass');
      expect(notifier.state.errorMessage, isNotNull);

      notifier.clearError();
      expect(notifier.state.errorMessage, isNull);
    });
  });
}
