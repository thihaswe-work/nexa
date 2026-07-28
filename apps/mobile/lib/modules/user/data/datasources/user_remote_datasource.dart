import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/utils/typedefs.dart';

final userRemoteDataSourceProvider = Provider<UserRemoteDataSource>((ref) {
  final dio = ref.read(dioClientProvider);
  return UserRemoteDataSource(dio);
});

class UserRemoteDataSource {
  final DioClient _dioClient;

  UserRemoteDataSource(this._dioClient);

  Future<JsonMap> getProfile() async {
    final response = await _dioClient.dio.get(ApiConstants.profile);
    return response.data as JsonMap;
  }

  Future<JsonMap> getProfileById(String userId) async {
    final response = await _dioClient.dio.get('${ApiConstants.users}/$userId');
    return response.data as JsonMap;
  }

  Future<JsonMap> updateProfile(JsonMap updates) async {
    final response = await _dioClient.dio.patch(
      ApiConstants.profile,
      data: updates,
    );
    return response.data as JsonMap;
  }

  Future<JsonMap> uploadAvatar(String filePath) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath),
    });
    final response = await _dioClient.dio.post(
      ApiConstants.uploadAvatar,
      data: formData,
    );
    return response.data as JsonMap;
  }

  Future<void> deleteAvatar() async {
    await _dioClient.dio.delete(ApiConstants.uploadAvatar);
  }

  Future<JsonList> getInterests() async {
    final response = await _dioClient.dio.get(ApiConstants.interests);
    return (response.data as JsonMap)['data'] as JsonList;
  }

  Future<void> updateInterests(List<String> interestIds) async {
    await _dioClient.dio.put(
      '${ApiConstants.profile}/interests',
      data: {'interestIds': interestIds},
    );
  }
}
