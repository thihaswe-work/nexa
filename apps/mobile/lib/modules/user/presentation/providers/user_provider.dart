import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/datasources/user_remote_datasource.dart';
import '../../data/repositories/user_repository_impl.dart';
import '../../domain/repositories/user_repository.dart';
import 'user_state.dart';

final userRepositoryProvider = Provider<UserRepository>((ref) {
  final remote = ref.read(userRemoteDataSourceProvider);
  return UserRepositoryImpl(remote);
});

final userProvider = StateNotifierProvider<UserNotifier, UserState>((ref) {
  final repository = ref.read(userRepositoryProvider);
  return UserNotifier(repository);
});

class UserNotifier extends StateNotifier<UserState> {
  final UserRepository _repository;

  UserNotifier(this._repository) : super(const UserState());

  Future<void> loadProfile() async {
    state = state.copyWith(status: UserStatus.loading, errorMessage: null);
    final result = await _repository.getProfile();
    result.fold(
      (failure) => state = state.copyWith(
        status: UserStatus.error,
        errorMessage: failure.message,
      ),
      (profile) => state = state.copyWith(
        status: UserStatus.loaded,
        profile: profile,
      ),
    );
  }

  Future<void> updateProfile(Map<String, dynamic> updates) async {
    state = state.copyWith(status: UserStatus.loading, errorMessage: null);
    final result = await _repository.updateProfile(updates);
    result.fold(
      (failure) => state = state.copyWith(
        status: UserStatus.error,
        errorMessage: failure.message,
      ),
      (profile) => state = state.copyWith(
        status: UserStatus.loaded,
        profile: profile,
      ),
    );
  }

  void clearError() {
    state = state.copyWith(errorMessage: null);
  }
}
