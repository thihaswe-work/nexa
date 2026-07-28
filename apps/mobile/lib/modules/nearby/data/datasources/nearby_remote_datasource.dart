import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/utils/typedefs.dart';
import '../models/location_model.dart';

final nearbyRemoteDataSourceProvider =
    Provider<NearbyRemoteDataSource>((ref) {
  final dio = ref.read(dioClientProvider);
  return NearbyRemoteDataSource(dio);
});

class NearbyRemoteDataSource {
  final DioClient _dioClient;

  NearbyRemoteDataSource(this._dioClient);

  Future<void> saveLocation(LocationModel location) async {
    await _dioClient.dio.post(
      ApiConstants.nearbySaveLocation,
      data: location.toJson(),
    );
  }

  Future<void> updateLocation(LocationModel location) async {
    await _dioClient.dio.put(
      ApiConstants.nearbySaveLocation,
      data: location.toJson(),
    );
  }

  Future<void> clearLocation() async {
    await _dioClient.dio.delete(ApiConstants.nearbyClearLocation);
  }

  Future<JsonMap> getCurrentLocation() async {
    final response = await _dioClient.dio.get(ApiConstants.nearbySaveLocation);
    return response.data as JsonMap;
  }

  Future<JsonList> searchNearby({
    double? lat,
    double? lng,
    int radius = 5000,
  }) async {
    final params = <String, dynamic>{
      'radius': radius,
    };
    if (lat != null) params['lat'] = lat;
    if (lng != null) params['lng'] = lng;

    final response = await _dioClient.dio.get(
      ApiConstants.nearbySearch,
      queryParameters: params,
    );
    return (response.data as JsonMap)['data'] as JsonList;
  }
}
