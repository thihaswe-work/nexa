import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/datasources/auth_local_datasource.dart';
import '../../data/datasources/auth_remote_datasource.dart';
import '../../data/repositories/auth_repository_impl.dart';
import '../../domain/repositories/auth_repository.dart';
import 'auth_state.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final remote = ref.read(authRemoteDataSourceProvider);
  final local = ref.read(authLocalDataSourceProvider);
  return AuthRepositoryImpl(remote, local);
});

final authNotifierProvider =
    StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final repository = ref.read(authRepositoryProvider);
  return AuthNotifier(repository);
});

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repository;

  AuthNotifier(this._repository) : super(const AuthState());

  Future<void> login(String email, String password) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    final result = await _repository.login(email, password);
    result.fold(
      (failure) => state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: failure.message,
      ),
      (_) async {
        final userResult = await _repository.getCurrentUser();
        userResult.fold(
          (failure) => state = state.copyWith(
            status: AuthStatus.error,
            errorMessage: failure.message,
          ),
          (user) => state = state.copyWith(
            status: AuthStatus.authenticated,
            user: user,
          ),
        );
      },
    );
  }

  Future<void> register(
      String email, String password, String displayName) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    final result = await _repository.register(email, password, displayName);
    result.fold(
      (failure) => state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: failure.message,
      ),
      (_) async {
        final userResult = await _repository.getCurrentUser();
        userResult.fold(
          (failure) => state = state.copyWith(
            status: AuthStatus.error,
            errorMessage: failure.message,
          ),
          (user) => state = state.copyWith(
            status: AuthStatus.authenticated,
            user: user,
          ),
        );
      },
    );
  }

  Future<void> logout() async {
    state = state.copyWith(status: AuthStatus.loading);
    final result = await _repository.logout();
    result.fold(
      (failure) => state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: failure.message,
      ),
      (_) => state = const AuthState(status: AuthStatus.unauthenticated),
    );
  }

  Future<void> checkAuth() async {
    final isAuth = await _repository.isAuthenticated();
    if (isAuth) {
      state = state.copyWith(status: AuthStatus.loading);
      final result = await _repository.getCurrentUser();
      result.fold(
        (_) => state =
            const AuthState(status: AuthStatus.unauthenticated),
        (user) => state = AuthState(
          status: AuthStatus.authenticated,
          user: user,
        ),
      );
    } else {
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  Future<void> forgotPassword(String email) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    final result = await _repository.forgotPassword(email);
    result.fold(
      (failure) => state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: failure.message,
      ),
      (_) => state = state.copyWith(status: AuthStatus.unauthenticated),
    );
  }

  void clearError() {
    state = state.copyWith(errorMessage: null);
  }
}
