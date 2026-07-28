import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../entities/nearby_user.dart';
import '../repositories/nearby_repository.dart';

class SearchNearby {
  final NearbyRepository _repository;

  SearchNearby(this._repository);

  Future<Either<Failure, List<NearbyUser>>> call({
    double? lat,
    double? lng,
    int radius = 5000,
  }) =>
      _repository.searchNearby(lat: lat, lng: lng, radius: radius);
}
