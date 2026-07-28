import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/errors/exceptions.dart';
import '../../domain/entities/location.dart';
import '../../domain/entities/nearby_user.dart';
import '../../domain/repositories/nearby_repository.dart';
import '../datasources/nearby_remote_datasource.dart';
import '../models/location_model.dart';
import '../models/nearby_user_model.dart';

class NearbyRepositoryImpl implements NearbyRepository {
  final NearbyRemoteDataSource _remote;

  NearbyRepositoryImpl(this._remote);

  @override
  Future<Either<Failure, void>> saveLocation(Location location) async {
    try {
      await _remote.saveLocation(
        LocationModel(lat: location.lat, lng: location.lng),
      );
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> updateLocation(Location location) async {
    try {
      await _remote.updateLocation(
        LocationModel(lat: location.lat, lng: location.lng),
      );
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> clearLocation() async {
    try {
      await _remote.clearLocation();
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Location?>> getCurrentLocation() async {
    try {
      final json = await _remote.getCurrentLocation();
      if (json['lat'] == null || json['lng'] == null) {
        return const Right(null);
      }
      return Right(LocationModel.fromJson(json));
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<NearbyUser>>> searchNearby({
    double? lat,
    double? lng,
    int radius = 5000,
  }) async {
    try {
      final jsonList = await _remote.searchNearby(
        lat: lat,
        lng: lng,
        radius: radius,
      );
      final users = jsonList
          .map((json) => NearbyUserModel.fromJson(json))
          .toList();
      return Right(users);
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}
