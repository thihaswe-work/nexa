import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/storage/secure_storage.dart';

final authLocalDataSourceProvider = Provider<AuthLocalDataSource>((ref) {
  final storage = ref.read(secureStorageProvider);
  return AuthLocalDataSource(storage);
});

class AuthLocalDataSource {
  final SecureStorage _storage;

  AuthLocalDataSource(this._storage);

  Future<void> saveTokens(String accessToken, String refreshToken) =>
      _storage.saveTokens(accessToken, refreshToken);

  Future<String?> getAccessToken() => _storage.getAccessToken();

  Future<String?> getRefreshToken() => _storage.getRefreshToken();

  Future<void> saveUserId(String userId) => _storage.saveUserId(userId);

  Future<String?> getUserId() => _storage.getUserId();

  Future<void> clearTokens() => _storage.clearTokens();

  Future<bool> isAuthenticated() async {
    final token = await _storage.getAccessToken();
    return token != null;
  }
}
