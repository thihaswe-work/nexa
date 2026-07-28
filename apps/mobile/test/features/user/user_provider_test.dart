import 'package:flutter_test/flutter_test.dart';
import 'package:fpdart/fpdart.dart';
import 'package:mocktail/mocktail.dart';
import 'package:nexa_mobile/core/errors/failures.dart';
import 'package:nexa_mobile/modules/user/presentation/providers/user_provider.dart';
import 'package:nexa_mobile/modules/user/presentation/providers/user_state.dart';
import '../../helpers/mocks.dart';

void main() {
  late UserNotifier notifier;
  late MockUserRepository mockRepository;

  setUp(() {
    mockRepository = MockUserRepository();
    notifier = UserNotifier(mockRepository);
  });

  group('initial state', () {
    test('should have initial status with no profile', () {
      expect(notifier.state.status, UserStatus.initial);
      expect(notifier.state.profile, isNull);
      expect(notifier.state.interests, isEmpty);
    });
  });

  group('loadProfile', () {
    test('should load profile successfully', () async {
      when(() => mockRepository.getProfile())
          .thenAnswer((_) async => Right(tProfile));

      await notifier.loadProfile();

      expect(notifier.state.status, UserStatus.loaded);
      expect(notifier.state.profile, tProfile);
      expect(notifier.state.interests, tProfile.interests);
    });

    test('should handle failure', () async {
      when(() => mockRepository.getProfile())
          .thenAnswer((_) async => Left(ServerFailure(message: 'Not found', statusCode: 404)));

      await notifier.loadProfile();

      expect(notifier.state.status, UserStatus.error);
      expect(notifier.state.errorMessage, 'Not found');
    });
  });

  group('updateProfile', () {
    final updatedProfile = tProfile.copyWith(
      displayName: 'Updated Name',
      bio: 'Updated bio',
    );

    test('should update profile successfully', () async {
      when(() => mockRepository.updateProfile(any()))
          .thenAnswer((_) async => Right(updatedProfile));

      await notifier.updateProfile(displayName: 'Updated Name', bio: 'Updated bio');

      expect(notifier.state.status, UserStatus.loaded);
      expect(notifier.state.profile?.displayName, 'Updated Name');
      expect(notifier.state.profile?.bio, 'Updated bio');
    });

    test('should handle update failure', () async {
      when(() => mockRepository.updateProfile(any()))
          .thenAnswer((_) async => Left(ServerFailure(message: 'Validation failed')));

      await notifier.updateProfile(displayName: 'Invalid');

      expect(notifier.state.status, UserStatus.error);
      expect(notifier.state.errorMessage, 'Validation failed');
    });
  });

  group('loadInterests', () {
    test('should load interests list', () async {
      when(() => mockRepository.getInterests())
          .thenAnswer((_) async => Right(tProfile.interests));

      await notifier.loadInterests();

      expect(notifier.state.interests, tProfile.interests);
      expect(notifier.state.interests.length, 1);
    });
  });
}
