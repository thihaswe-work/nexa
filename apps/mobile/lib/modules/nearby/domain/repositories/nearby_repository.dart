import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../entities/location.dart';
import '../entities/nearby_user.dart';

abstract class NearbyRepository {
  Future<Either<Failure, void>> saveLocation(Location location);
  Future<Either<Failure, void>> updateLocation(Location location);
  Future<Either<Failure, void>> clearLocation();
  Future<Either<Failure, Location?>> getCurrentLocation();
  Future<Either<Failure, List<NearbyUser>>> searchNearby({
    double? lat,
    double? lng,
    int radius = 5000,
  });
}
