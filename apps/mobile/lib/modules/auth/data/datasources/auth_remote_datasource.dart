import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/utils/typedefs.dart';
import '../models/auth_response.dart';
import '../models/login_request.dart';
import '../models/register_request.dart';

final authRemoteDataSourceProvider = Provider<AuthRemoteDataSource>((ref) {
  final dio = ref.read(dioClientProvider);
  return AuthRemoteDataSource(dio);
});

class AuthRemoteDataSource {
  final DioClient _dioClient;

  AuthRemoteDataSource(this._dioClient);

  Future<AuthResponse> login(LoginRequest request) async {
    final response = await _dioClient.dio.post(
      ApiConstants.login,
      data: request.toJson(),
    );
    return AuthResponse.fromJson(response.data as JsonMap);
  }

  Future<AuthResponse> register(RegisterRequest request) async {
    final response = await _dioClient.dio.post(
      ApiConstants.register,
      data: request.toJson(),
    );
    return AuthResponse.fromJson(response.data as JsonMap);
  }

  Future<void> logout() async {
    await _dioClient.dio.post(ApiConstants.logout);
  }

  Future<AuthResponse> refreshToken(String refreshToken) async {
    final response = await _dioClient.dio.post(
      ApiConstants.refreshToken,
      data: {'refreshToken': refreshToken},
    );
    return AuthResponse.fromJson(response.data as JsonMap);
  }

  Future<JsonMap> getCurrentUser() async {
    final response = await _dioClient.dio.get(ApiConstants.profile);
    return response.data as JsonMap;
  }

  Future<void> forgotPassword(String email) async {
    await _dioClient.dio.post(
      ApiConstants.forgotPassword,
      data: {'email': email},
    );
  }

  Future<void> resetPassword(String token, String password) async {
    await _dioClient.dio.post(
      ApiConstants.resetPassword,
      data: {'token': token, 'password': password},
    );
  }

  Future<void> verifyEmail(String token) async {
    await _dioClient.dio.post(
      ApiConstants.verifyEmail,
      data: {'token': token},
    );
  }
}
